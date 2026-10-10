-- A criação da tabela também recebeu privilégios de tabela que não passam pelo RLS.
-- TRUNCATE, em especial, apagaria todas as linhas. A aplicação só precisa de SELECT, INSERT e UPDATE.

revoke truncate, references, trigger on table public.entities from authenticated;
