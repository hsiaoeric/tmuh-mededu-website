// Migration-derived shape. Replace this file with `supabase gen types` when a
// linked project is available; this is intentionally not claimed as generated.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type CmsDocumentKind =
  | 'site_copy'
  | 'centers'
  | 'people'
  | 'news'
  | 'activities'
  | 'kpis'
  | 'honors'
  | 'digital_materials'
  | 'facdev'
  | 'ebm'
  | 'holistic'
  | 'holistic_research';

type CmsRevisionStatus = 'draft' | 'published' | 'archived';

type CmsDocumentRow = {
  id: string;
  kind: CmsDocumentKind;
  stable_key: string;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
};

type CmsRevisionRow = {
  id: string;
  document_id: string;
  version: number;
  edit_version: number;
  status: CmsRevisionStatus;
  payload: Json;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
  published_at: string | null;
  published_by: string | null;
  archived_at: string | null;
  archived_by: string | null;
  publication_expected_edit_version: number | null;
  publication_replacements: Json | null;
  publication_actor_id: string | null;
};

type PublishedContentRow = {
  document_id: string | null;
  kind: CmsDocumentKind | null;
  stable_key: string | null;
  revision_id: string | null;
  version: number | null;
  payload: Json | null;
  published_at: string | null;
};

export type Database = {
  public: {
    Tables: {
      cms_admins: {
        Row: { user_id: string; created_at: string; created_by: string | null };
        Insert: { user_id: string; created_at?: string; created_by?: string | null };
        Update: { user_id?: string; created_at?: string; created_by?: string | null };
        Relationships: [];
      };
      cms_documents: {
        Row: CmsDocumentRow;
        Insert: {
          id?: string;
          kind: CmsDocumentKind;
          stable_key: string;
          created_at?: string;
          created_by?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: Partial<CmsDocumentRow>;
        Relationships: [];
      };
      cms_revisions: {
        Row: CmsRevisionRow;
        Insert: {
          id?: string;
          document_id: string;
          version: number;
          edit_version?: number;
          status?: CmsRevisionStatus;
          payload: Json;
          created_at?: string;
          created_by?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          published_at?: string | null;
          published_by?: string | null;
          archived_at?: string | null;
          archived_by?: string | null;
          publication_expected_edit_version?: number | null;
          publication_replacements?: Json | null;
          publication_actor_id?: string | null;
        };
        Update: Partial<CmsRevisionRow>;
        Relationships: [
          {
            foreignKeyName: 'cms_revisions_document_id_fkey';
            columns: ['document_id'];
            isOneToOne: false;
            referencedRelation: 'cms_documents';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      cms_published_content: { Row: PublishedContentRow; Relationships: [] };
    };
    Functions: {
      cms_archive_revision: {
        Args: {
          p_document_id: string;
          p_revision_id: string;
          p_expected_edit_version: number;
        };
        Returns: CmsRevisionRow;
      };
      cms_clone_revision: {
        Args: { p_document_id: string; p_source_revision_id?: string | null };
        Returns: CmsRevisionRow;
      };
      cms_get_published_content: {
        Args: { p_kind?: CmsDocumentKind | null; p_stable_key?: string | null };
        Returns: PublishedContentRow[];
      };
      cms_prepare_media_publication: {
        Args: {
          p_document_id: string;
          p_revision_id: string;
          p_expected_edit_version: number;
          p_actor_id: string;
        };
        Returns: {
          kind: CmsDocumentKind;
          status: CmsRevisionStatus;
          payload: Json;
          persisted_replacements: Json;
        }[];
      };
      cms_finalize_media_publication: {
        Args: {
          p_document_id: string;
          p_revision_id: string;
          p_expected_edit_version: number;
          p_actor_id: string;
          p_replacements: Json;
        };
        Returns: CmsRevisionRow;
      };
      cms_payload_is_publishable: {
        Args: { candidate: Json };
        Returns: boolean;
      };
      cms_publish_revision: {
        Args: {
          p_document_id: string;
          p_revision_id: string;
          p_expected_edit_version: number;
        };
        Returns: CmsRevisionRow;
      };
      cms_save_draft: {
        Args: {
          p_document_id: string;
          p_revision_id: string;
          p_expected_edit_version: number;
          p_payload: Json;
        };
        Returns: CmsRevisionRow;
      };
      is_cms_admin: {
        Args: never;
        Returns: boolean;
      };
    };
    Enums: {
      cms_document_kind: CmsDocumentKind;
      cms_revision_status: CmsRevisionStatus;
    };
    CompositeTypes: Record<never, never>;
  };
};
