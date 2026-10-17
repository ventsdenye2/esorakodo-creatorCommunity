# Forum authoring and live collaboration runtime

Source: 2db0eda68558560a9648dfa70354f6bd078db936 (deploy/backend), 2026-10-17.
Requires migration 202610170001_forum_collaboration.sql, applied and verified.
Linux x86_64 build in WSL, Node 24.19.0; production uses existing Node 22.
Natural message-based editor, published rewriting, authenticated concurrent Yjs edits,
public SSE updates, owner-managed collaborators, offline/Chinese input handling.
Windows lint/typecheck and 19 unit, 31 new DB, 124 legacy DB checks passed;
Linux standalone smoke passed. Production acceptance follows updater.
Previous runtime ab0f844 remains rollback. No environment or test credentials included.
