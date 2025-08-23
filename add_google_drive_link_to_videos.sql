-- Migração para adicionar campo google_drive_link na tabela videos
-- Este campo armazenará o link da pasta do Google Drive com arquivos necessários para produção

ALTER TABLE public.videos 
ADD COLUMN google_drive_link text;

-- Adicionar comentário na coluna
COMMENT ON COLUMN public.videos.google_drive_link IS 'Link da pasta do Google Drive contendo arquivos necessários para a produção do vídeo';