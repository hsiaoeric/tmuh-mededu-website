import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/content/database.types';
import type { SupabaseConfig } from '@/content/env';
import { getAdminSupabaseClient } from '@/content/supabaseClient';
import { createAdminDocumentRepository } from './repository';
import { createSupabasePublicationClient } from './publicationClient';
import type {
  AdminDocumentOperations,
  AdminDocumentRepository,
  OperationResponse,
  Wave3RpcArgs,
  Wave3RpcName,
} from './types';

export function createAdminDocumentOperations(
  client: SupabaseClient<Database>,
): AdminDocumentOperations {
  return {
    async listDocuments(signal): Promise<OperationResponse> {
      const query = client.from('cms_documents').select('*').order('kind');
      if (signal !== undefined) query.abortSignal(signal);
      const response = await query;
      return { data: response.data, error: response.error };
    },
    async listRevisionStatuses(signal): Promise<OperationResponse> {
      const query = client.from('cms_revisions')
        .select('document_id, version, status, updated_at')
        .in('status', ['draft', 'published']);
      if (signal !== undefined) query.abortSignal(signal);
      const response = await query;
      return { data: response.data, error: response.error };
    },
    async readDocument(documentId, signal): Promise<OperationResponse> {
      const documentQuery = client.from('cms_documents').select('*').eq('id', documentId);
      if (signal !== undefined) documentQuery.abortSignal(signal);
      const documentResponse = await documentQuery.single();
      if (documentResponse.error !== null) {
        return { data: documentResponse.data, error: documentResponse.error };
      }
      const revisionsQuery = client.from('cms_revisions').select('*').eq('document_id', documentId).order('version', { ascending: false });
      if (signal !== undefined) revisionsQuery.abortSignal(signal);
      const revisionsResponse = await revisionsQuery;
      return {
        data: {
          document: documentResponse.data,
          revisions: revisionsResponse.data,
        },
        error: revisionsResponse.error,
      };
    },
    async rpc<Name extends Wave3RpcName>(
      name: Name,
      args: Wave3RpcArgs<Name>,
      signal?: AbortSignal,
    ): Promise<OperationResponse> {
      const query = client.rpc(name, args);
      if (signal !== undefined) query.abortSignal(signal);
      const response = await query;
      return { data: response.data, error: response.error };
    },
  };
}

export function createSupabaseAdminDocumentRepository(
  client: SupabaseClient<Database>,
): AdminDocumentRepository {
  return createAdminDocumentRepository(
    createAdminDocumentOperations(client),
    createSupabasePublicationClient(client),
  );
}

export async function loadBrowserAdminDocumentRepository(
  config: SupabaseConfig,
): Promise<AdminDocumentRepository> {
  return createSupabaseAdminDocumentRepository(await getAdminSupabaseClient(config));
}
