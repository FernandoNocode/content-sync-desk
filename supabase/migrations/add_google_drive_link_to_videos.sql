-- Add google_drive_link field to videos table
-- This field will store the Google Drive folder link for production files

ALTER TABLE public.videos 
ADD COLUMN google_drive_link text;

-- Add comment to document the purpose of this field
COMMENT ON COLUMN public.videos.google_drive_link IS 'Link para a pasta do Google Drive contendo todos os arquivos necessários para a produção do vídeo';