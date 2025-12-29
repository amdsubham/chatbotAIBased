import { db } from "../helpers/db";
import { schema, OutputType } from "./knowledge-base_GET.schema";
import superjson from 'superjson';

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const queryParams = {
      search: url.searchParams.get('search'),
    };

    const { search } = schema.parse(queryParams);

    let query = db.selectFrom('knowledgeBase')
      .selectAll()
      .orderBy('createdAt', 'desc');

    if (search) {
      const searchTerm = `%${search}%`;
      query = query.where((eb) => eb.or([
        eb('question', 'ilike', searchTerm),
        eb('answer', 'ilike', searchTerm),
      ]));
    }

    const knowledgeBaseEntries = await query.execute();

    return new Response(superjson.stringify(knowledgeBaseEntries satisfies OutputType), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching knowledge base:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
  }
}