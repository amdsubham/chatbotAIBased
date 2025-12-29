import { db } from "../../helpers/db";
import { schema, InputType } from "./export_POST.schema";
import superjson from 'superjson';
import PdfPrinter from "pdfmake";
import { TDocumentDefinitions } from "pdfmake/interfaces";
import { Selectable } from "kysely";
import { Chats, Messages } from "../../helpers/schema";

const generateTxt = (chat: Selectable<Chats> & { messages: Selectable<Messages>[] }): string => {
  let content = `Chat Transcript\n`;
  content += `====================================\n`;
  content += `Chat ID: ${chat.id}\n`;
  content += `Merchant Email: ${chat.merchantEmail}\n`;
  if (chat.shopName) content += `Shop Name: ${chat.shopName}\n`;
  if (chat.shopDomain) content += `Shop Domain: ${chat.shopDomain}\n`;
  content += `Status: ${chat.status}\n`;
  content += `Created At: ${new Date(chat.createdAt).toLocaleString()}\n`;
  content += `====================================\n\n`;

  if (chat.errorContext) {
    content += `Error Context:\n`;
    content += `------------------------------------\n`;
    content += `${chat.errorContext}\n`;
    content += `------------------------------------\n\n`;
  }

  content += `Messages:\n`;
  content += `------------------------------------\n`;
  chat.messages.forEach(msg => {
    const sender = msg.sender.charAt(0).toUpperCase() + msg.sender.slice(1);
    content += `[${new Date(msg.createdAt).toLocaleString()}] ${sender}:\n`;
    content += `${msg.content}\n`;
    if (msg.imageUrl) {
      content += `(Image attached: ${msg.imageUrl})\n`;
    }
    content += `\n`;
  });

  return content;
};

const generatePdf = (chat: Selectable<Chats> & { messages: Selectable<Messages>[] }): Promise<Buffer> => {
  const fonts = {
    Roboto: {
      normal: 'fonts/Roboto-Regular.ttf',
      bold: 'fonts/Roboto-Medium.ttf',
      italics: 'fonts/Roboto-Italic.ttf',
      bolditalics: 'fonts/Roboto-MediumItalic.ttf'
    }
  };
  const printer = new PdfPrinter(fonts);

  const messageContent = chat.messages.map(msg => {
    const sender = msg.sender.charAt(0).toUpperCase() + msg.sender.slice(1);
    const timestamp = new Date(msg.createdAt).toLocaleString();
    return [
      { text: `${sender} `, bold: true },
      { text: `(${timestamp}):`, color: 'gray', italics: true },
      `\n${msg.content}`,
      msg.imageUrl ? { text: `\n[Image attached]`, italics: true, color: 'blue' } : ''
    ];
  });

  const docDefinition: TDocumentDefinitions = {
    content: [
      { text: 'Chat Transcript', style: 'header' },
      { text: `Chat ID: ${chat.id}`, style: 'subheader' },
      {
        style: 'metadataTable',
        table: {
          body: [
            ['Merchant Email', chat.merchantEmail],
            ['Shop Name', chat.shopName ?? 'N/A'],
            ['Shop Domain', chat.shopDomain ?? 'N/A'],
            ['Status', chat.status],
            ['Created At', new Date(chat.createdAt).toLocaleString()],
          ]
        },
        layout: 'noBorders'
      },
      ...(chat.errorContext ? [
        { text: 'Error Context', style: 'subheader' },
        { text: chat.errorContext, style: 'code' },
      ] : []),
      { text: 'Messages', style: 'subheader' },
      {
        ul: messageContent,
        style: 'messageList'
      }
    ],
    styles: {
      header: { fontSize: 22, bold: true, margin: [0, 0, 0, 10] },
      subheader: { fontSize: 16, bold: true, margin: [0, 15, 0, 5] },
      metadataTable: { margin: [0, 5, 0, 15] },
      code: {
        background: '#eeeeee',
        margin: [0, 5, 0, 15],
        font: 'Roboto' // Monospaced-like
      },
      messageList: { margin: [0, 5, 0, 15] }
    },
    defaultStyle: {
      font: 'Roboto'
    }
  };

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    pdfDoc.on('data', (chunk) => chunks.push(chunk));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', (err) => reject(err));
    pdfDoc.end();
  });
};

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const { chatId, format } = schema.parse(json);

    const chat = await db.selectFrom('chats')
      .selectAll()
      .where('id', '=', chatId)
      .executeTakeFirst();

    if (!chat) {
      return new Response(superjson.stringify({ error: "Chat not found" }), { status: 404 });
    }

    const messages = await db.selectFrom('messages')
      .selectAll()
      .where('chatId', '=', chatId)
      .orderBy('createdAt', 'asc')
      .execute();

    const fullChat = { ...chat, messages };

    switch (format) {
      case 'json': {
        const jsonString = superjson.stringify(fullChat);
        return new Response(jsonString, {
          headers: { 
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="chat-transcript-${chatId}.json"`
          },
        });
      }
      case 'txt': {
        const txtContent = generateTxt(fullChat);
        return new Response(txtContent, {
          headers: { 
            'Content-Type': 'text/plain; charset=utf-8',
            'Content-Disposition': `attachment; filename="chat-transcript-${chatId}.txt"`
          },
        });
      }
      case 'pdf': {
        const pdfBuffer = await generatePdf(fullChat);
        return new Response(pdfBuffer, {
          headers: { 
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="chat-transcript-${chatId}.pdf"`
          },
        });
      }
      default: {
        return new Response(superjson.stringify({ error: "Invalid format specified" }), { status: 400 });
      }
    }
  } catch (error) {
    console.error("Error exporting chat:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
  }
}