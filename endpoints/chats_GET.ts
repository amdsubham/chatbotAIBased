import { db } from "../helpers/db";
import { schema, OutputType } from "./chats_GET.schema";
import superjson from 'superjson';
import { sql } from 'kysely';

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const queryParams = {
      status: url.searchParams.get('status') || undefined,
      merchantEmail: url.searchParams.get('merchantEmail') || undefined,
      searchQuery: url.searchParams.get('searchQuery') || undefined,
      dateFrom: url.searchParams.get('dateFrom') || undefined,
      dateTo: url.searchParams.get('dateTo') || undefined,
      hasAdminResponse: url.searchParams.get('hasAdminResponse') || undefined,
      needsAttention: url.searchParams.get('needsAttention') || undefined,
      aiAutoResponseOff: url.searchParams.get('aiAutoResponseOff') || undefined,
    };

    const { status, merchantEmail, searchQuery, dateFrom, dateTo, hasAdminResponse, needsAttention, aiAutoResponseOff } = schema.parse(queryParams);

    // Subquery to get the latest message ID for each chat
    const latestMessageIds = db
      .selectFrom('messages')
      .select(['chatId', (eb) => eb.fn.max('messages.id').as('maxMessageId')])
      .groupBy('messages.chatId')
      .as('latestMessageIds');

    // Subquery to count admin messages for each chat
    const adminMessageCounts = db
      .selectFrom('messages')
      .select(['chatId', (eb) => eb.fn.count('messages.id').as('adminMessageCount')])
      .where('messages.sender', '=', 'admin')
      .groupBy('messages.chatId')
      .as('adminMessageCounts');

    // Subquery to count unread user messages for each chat
    const unreadUserMessageCounts = db
      .selectFrom('messages')
      .select(['chatId', (eb) => eb.fn.count('messages.id').as('unreadUserMessageCount')])
      .where('messages.sender', '=', 'user')
      .where('messages.viewedAt', 'is', null)
      .groupBy('messages.chatId')
      .as('unreadUserMessageCounts');

    // Subquery to count unread AI/admin messages for each chat
    const unreadAiAdminMessageCounts = db
      .selectFrom('messages')
      .select(['chatId', (eb) => eb.fn.count('messages.id').as('unreadAiAdminMessageCount')])
      .where((eb) => eb.or([
        eb('messages.sender', '=', 'ai'),
        eb('messages.sender', '=', 'admin')
      ]))
      .where('messages.viewedAt', 'is', null)
      .groupBy('messages.chatId')
      .as('unreadAiAdminMessageCounts');

    // Subquery to get the latest unread AI/admin message timestamp for each chat
    const latestUnreadAiAdminMessageTimes = db
      .selectFrom('messages')
      .select(['chatId', (eb) => eb.fn.max('messages.createdAt').as('latestUnreadAiAdminMessageAt')])
      .where((eb) => eb.or([
        eb('messages.sender', '=', 'ai'),
        eb('messages.sender', '=', 'admin')
      ]))
      .where('messages.viewedAt', 'is', null)
      .groupBy('messages.chatId')
      .as('latestUnreadAiAdminMessageTimes');

    let query = db
      .selectFrom('chats')
      .leftJoin(latestMessageIds, 'latestMessageIds.chatId', 'chats.id')
      .leftJoin('messages', 'messages.id', 'latestMessageIds.maxMessageId')
      .leftJoin(adminMessageCounts, 'adminMessageCounts.chatId', 'chats.id')
      .leftJoin(unreadUserMessageCounts, 'unreadUserMessageCounts.chatId', 'chats.id')
      .leftJoin(unreadAiAdminMessageCounts, 'unreadAiAdminMessageCounts.chatId', 'chats.id')
      .leftJoin(latestUnreadAiAdminMessageTimes, 'latestUnreadAiAdminMessageTimes.chatId', 'chats.id')
      .select([
        'chats.id',
        'chats.merchantEmail',
        'chats.shopDomain',
        'chats.shopName',
        'chats.status',
        'chats.errorContext',
        'chats.createdAt',
        'chats.updatedAt',
        'chats.lastUserMessageAt',
        'chats.emailNotificationSent',
        'chats.aiAutoResponseEnabled',
        'chats.feedbackText',
        'chats.ratedAt',
        'chats.rating',
        'chats.widgetLastSeenAt',
        'chats.widgetOpen',
        'messages.content as latestMessageContent',
        'messages.createdAt as latestMessageCreatedAt',
        'messages.sender as latestMessageSender',
        'adminMessageCounts.adminMessageCount',
        'unreadUserMessageCounts.unreadUserMessageCount',
        'unreadAiAdminMessageCounts.unreadAiAdminMessageCount',
        'latestUnreadAiAdminMessageTimes.latestUnreadAiAdminMessageAt',
      ])
                        .orderBy((eb) => eb.fn.coalesce('unreadAiAdminMessageCounts.unreadAiAdminMessageCount', eb.lit(0)), 'desc')
      .orderBy((eb) => sql`COALESCE(${eb.ref('latestUnreadAiAdminMessageTimes.latestUnreadAiAdminMessageAt')}, '1970-01-01'::timestamp)`, 'desc')
      .orderBy((eb) => eb.fn.coalesce('unreadUserMessageCounts.unreadUserMessageCount', eb.lit(0)), 'desc')
      .orderBy('chats.updatedAt', 'desc');

    // Existing filters
    if (status) {
      query = query.where('chats.status', '=', status);
    }

    if (merchantEmail) {
      query = query.where('chats.merchantEmail', '=', merchantEmail);
    }

    // New filters
    if (searchQuery) {
      // Search across multiple fields using ILIKE (case-insensitive)
      // Also search in message content using a subquery
      const searchPattern = `%${searchQuery}%`;
      
      query = query.where((eb) => 
        eb.or([
          eb('chats.merchantEmail', 'ilike', searchPattern),
          eb('chats.shopName', 'ilike', searchPattern),
          eb('chats.shopDomain', 'ilike', searchPattern),
          eb('chats.errorContext', 'ilike', searchPattern),
          eb.exists(
            eb.selectFrom('messages')
              .select('messages.id')
              .whereRef('messages.chatId', '=', 'chats.id')
              .where('messages.content', 'ilike', searchPattern)
          )
        ])
      );
    }

    if (dateFrom) {
      query = query.where('chats.createdAt', '>=', new Date(dateFrom));
    }

    if (dateTo) {
      query = query.where('chats.createdAt', '<=', new Date(dateTo));
    }

    if (hasAdminResponse !== undefined) {
      if (hasAdminResponse) {
        // Has admin response: admin message count > 0
        query = query.having((eb) => eb(eb.fn.coalesce('adminMessageCounts.adminMessageCount', eb.lit(0)), '>', 0));
      } else {
        // No admin response: admin message count = 0 or null
        query = query.having((eb) => eb(eb.fn.coalesce('adminMessageCounts.adminMessageCount', eb.lit(0)), '=', 0));
      }
    }

    if (needsAttention) {
      // Filter for chats that need admin attention:
      // - Has user messages (lastUserMessageAt is not null)
      // - No admin response (adminMessageCount = 0 or null)
      // - Status is active or unresolved
      // - Email notification not sent
      query = query
        .where('chats.lastUserMessageAt', 'is not', null)
        .where((eb) => eb.or([
          eb('chats.status', '=', 'active'),
          eb('chats.status', '=', 'unresolved')
        ]))
        .where('chats.emailNotificationSent', '=', false)
        .having((eb) => eb(eb.fn.coalesce('adminMessageCounts.adminMessageCount', eb.lit(0)), '=', 0));
    }

    if (aiAutoResponseOff !== undefined) {
      if (aiAutoResponseOff) {
        // Filter for chats with AI auto-response disabled (false or null)
        query = query.where((eb) => eb.or([
          eb('chats.aiAutoResponseEnabled', '=', false),
          eb('chats.aiAutoResponseEnabled', 'is', null)
        ]));
      } else {
        // Filter for chats with AI auto-response enabled
        query = query.where('chats.aiAutoResponseEnabled', '=', true);
      }
    }

    const results = await query.execute();
    
    const responseData: OutputType = results.map(row => ({
      id: row.id,
      merchantEmail: row.merchantEmail,
      shopDomain: row.shopDomain,
      shopName: row.shopName,
      status: row.status,
      errorContext: row.errorContext,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      lastUserMessageAt: row.lastUserMessageAt,
      emailNotificationSent: row.emailNotificationSent,
      aiAutoResponseEnabled: row.aiAutoResponseEnabled,
      feedbackText: row.feedbackText,
      ratedAt: row.ratedAt,
      rating: row.rating,
      widgetLastSeenAt: row.widgetLastSeenAt,
      widgetOpen: row.widgetOpen,
      hasAdminResponse: row.adminMessageCount !== null && Number(row.adminMessageCount) > 0,
      unreadUserMessageCount: row.unreadUserMessageCount !== null ? Number(row.unreadUserMessageCount) : 0,
      unreadAiAdminMessageCount: row.unreadAiAdminMessageCount !== null ? Number(row.unreadAiAdminMessageCount) : 0,
      latestUnreadAiAdminMessageAt: row.latestUnreadAiAdminMessageAt || null,
      latestMessage: row.latestMessageContent !== null ? {
        content: row.latestMessageContent,
        createdAt: row.latestMessageCreatedAt!,
        sender: row.latestMessageSender!,
      } : null,
    }));

    return new Response(superjson.stringify(responseData satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching chats:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
  }
}