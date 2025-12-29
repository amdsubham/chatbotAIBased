import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Chats, Messages, ChatStatusArrayValues } from "../helpers/schema";

export const schema = z.object({
  status: z.enum(ChatStatusArrayValues).optional(),
  merchantEmail: z.string().email().optional(),
  searchQuery: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  hasAdminResponse: z.enum(['true', 'false']).optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  needsAttention: z.enum(['true', 'false']).optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  aiAutoResponseOff: z.enum(['true', 'false']).optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
});

export type InputType = z.infer<typeof schema>;

export type ChatWithLatestMessage = Selectable<Chats> & {
  latestMessage: Pick<Selectable<Messages>, 'content' | 'createdAt' | 'sender'> | null;
  hasAdminResponse: boolean;
  unreadUserMessageCount: number;
  unreadAiAdminMessageCount: number;
  latestUnreadAiAdminMessageAt: Date | null;
};

export type OutputType = ChatWithLatestMessage[];

export const getChats = async (params?: InputType, init?: RequestInit): Promise<OutputType> => {
  const queryParams = new URLSearchParams();
  if (params?.status) {
    queryParams.set('status', params.status);
  }
  if (params?.merchantEmail) {
    queryParams.set('merchantEmail', params.merchantEmail);
  }
  if (params?.searchQuery) {
    queryParams.set('searchQuery', params.searchQuery);
  }
  if (params?.dateFrom) {
    queryParams.set('dateFrom', params.dateFrom);
  }
  if (params?.dateTo) {
    queryParams.set('dateTo', params.dateTo);
  }
  if (params?.hasAdminResponse !== undefined) {
    queryParams.set('hasAdminResponse', params.hasAdminResponse.toString());
  }
  if (params?.needsAttention !== undefined) {
    queryParams.set('needsAttention', params.needsAttention.toString());
  }
  if (params?.aiAutoResponseOff !== undefined) {
    queryParams.set('aiAutoResponseOff', params.aiAutoResponseOff.toString());
  }
  
  const result = await fetch(`/_api/chats?${queryParams.toString()}`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse<{ error: string }>(await result.text());
    throw new Error(errorObject.error);
  }
  return superjson.parse<OutputType>(await result.text());
};