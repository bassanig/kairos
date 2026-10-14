# Ritmo

Standalone Cloudflare deployment is prepared in [DEPLOY.md](./DEPLOY.md), with a private owner key chosen by you, D1 migrations and deploy scripts. The existing Sites workflow is still available.

Agenda pessoal em TypeScript + React, com servidor Vinext/Cloudflare Workers e banco Cloudflare D1 (SQLite). Publicação privada pelo Sites, com identificação autenticada no servidor.

## Recursos

- Grade de duas semanas com datas reais, navegável por quinzenas.
- Colunas de horário ou tarefas, inclusive colunas personalizadas sem data.
- Linhas inicialmente com 30 minutos; duração individual de 5 a 240 minutos.
- Tarefas com título, descrição, oito cores e conclusão independente por ocorrência.
- Arrastar para mover ou trocar dois cartões. O tamanho é preservado em **linhas**: se as linhas tiverem durações diferentes, o tempo resultante muda conforme os horários de destino.
- Redimensionamento pela borda inferior, limitado pela próxima tarefa.
- Replicação para o mesmo dia na semana seguinte já presente na grade; conflitos impedem a alteração inteira. Não copia conclusão nem alterações na estrutura global de linhas/colunas.
- Visualização por conclusão, busca, desfazer até 30 alterações.
- Salvamento serializado no banco, verificação de versão para impedir sobrescrita por outra aba, aviso e nova tentativa em caso de falha.

## Desenvolvimento

Node 22.13+ e pnpm. Instale as dependências com `pnpm install`, gere migrações com `pnpm db:generate`, execute `pnpm dev`. O ambiente hospedado injeta os cabeçalhos de identidade `oai-authenticated-user-id` e `oai-authenticated-user-email`. O backend exige ambos. No desenvolvimento local, configure um proxy de teste confiável para injetá-los; nunca confie em cabeçalhos enviados diretamente por um navegador em uma hospedagem pública própria.

`node --experimental-strip-types --test tests/planner.test.ts` executa os testes das regras. `pnpm exec tsc --noEmit` verifica os tipos; `pnpm build` compila.

## Dados e implantação

`db/schema.ts` declara o banco; `drizzle/` contém a migração. A tabela `planners` guarda um documento de agenda e sua revisão por usuário autenticado. `.openai/hosting.json` declara o binding D1 `DB`. A publicação Sites provisiona o banco e aplica as migrações.

Para hospedar fora de Sites em uma conta Cloudflare própria, configure o binding D1, aplique as migrações e substitua `app/chatgpt-auth.ts` por autenticação confiável do seu ambiente. Os cabeçalhos de identidade usados aqui são fornecidos pela plataforma Sites. Não torne a API pública sem essa adaptação.

## Estrutura

- `app/planner-app.tsx`: interface, editor, interações e fila de salvamento.
- `lib/planner.ts`: datas, grade, conflitos, trocas e replicação.
- `app/api/planner/route.ts`: API autenticada, validação e controle de versão.
- `app/globals.css`: interface escura responsiva.

Arrastar é direcionado ao desktop. Em telas sensíveis ao toque, o editor permite alterar a coluna, o início e a quantidade de linhas sem depender de arrastar.

## Kairos: salas e integração

A agenda existente continua em `planners`, identificada pelo proprietário original. A tabela `rooms` acrescenta hashes SHA-256 de dois segredos independentes, aleatórios de 192 bits: senha da sala e token de API. Nenhuma senha é incluída no código ou guardada em texto puro no banco.

- Criador: login hospedado do ChatGPT → Sala e acesso → Ativar minha sala.
- Convidado: senha gerada → cookie Secure/HttpOnly/SameSite=Strict por 30 dias. Todos os convidados podem ler e editar a sala; não há identificação individual.
- IA externa: chave gerada no painel, enviada como `Authorization: Bearer <token>` em GET/PUT `/api/planner`.
- Contrato OpenAPI: `/api/openapi`. PUT exige `{state, revision}`; conflitos retornam 409. Validação rejeita sobreposições e grades fora dos limites.
- Rotação da senha invalida os cookies anteriores. Rotação/revogação da chave é independente.
- Atualização das outras telas a cada 10 segundos quando não há edição local em andamento. Edições em conflito exigem recarregamento explícito.

A página de entrada deve ser pública na configuração Sites para convidados entrarem sem ChatGPT. Todos os endpoints de dados autorizam a sala no servidor. A integração fornece ferramentas de leitura e escrita para uma IA externa; não inclui um modelo ou chatbot embutido.

Verificação: TypeScript, build de produção, testes de planejamento e testes de autenticação/isolamento/revogação/concorrência com banco simulado.
