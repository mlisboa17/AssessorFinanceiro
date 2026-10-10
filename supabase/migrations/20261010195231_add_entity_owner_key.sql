-- A chave primária de entities continua sendo id.
-- O par (id, user_id) é único porque id já é único.
-- Ele existe só para a conta e o cartão referenciarem entidade e dono juntos.

alter table public.entities
  add constraint entities_id_user_id_key unique (id, user_id);
