# Implementar e verificar o plano do Stylisme

## Objetivo
Transformar o documento enviado em funcionalidades reais e coerentes. A publicação de looks ficará disponível para Free e Premium; o Free mantém limite diário e o Premium publica sem limite. Também será criado o portal completo de lojas, campanhas e administração.

## 1. Corrigir a experiência atual
- Destacar “Seu próximo look” no armário vazio e preenchido.
- Completar a jornada de descoberta com referências visuais reais, imagens de resultado, ajuste de preferências e inspiração sem compra mesmo sem peças cadastradas.
- Corrigir o consumo de IA: informar antes de cada ação, contar somente gerações concluídas e validar os limites Free no servidor.
- Renomear “Feed” para “Inspire-se” em navegação, títulos e textos, mantendo o endereço atual para não quebrar links.
- Adicionar no armário uma prévia de publicações com “Ver todos”.
- Corrigir o aviso de hidratação já identificado na página e revisar textos/estados de erro.

## 2. Completar a comunidade Inspire-se
- Manter publicação explícita e fotos privadas até a confirmação do usuário.
- Permitir curtir/descurtir sem duplicação, salvar inspiração dentro do app e compartilhar apenas o link de publicações alheias.
- Para conteúdo próprio, oferecer download nos formatos publicação e story, além do compartilhamento quando o aparelho permitir; os rótulos mostrarão a ação real.
- Adicionar exclusão pelo autor, denúncia com motivo, fila de moderação e suspensão por administrador.
- Identificar conteúdo editorial/demonstração e manter curtidas exclusivamente reais.
- Validar imagens grandes, inválidas e permissões para impedir alterações no conteúdo de outras pessoas.

## 3. Patrocínios e descoberta de lojas
- Substituir o modelo limitado de anúncios cadastrados manualmente por lojas, produtos e campanhas separados.
- Registrar área de atendimento da loja e segmentação da campanha como informações independentes.
- Permitir cidade manual no perfil e usar estilo, ocasião e localização apenas para relevância publicitária, nunca para distorcer recomendações da IA.
- Criar cards “Patrocinado” com imagem, loja, “Seu próximo look pode estar aqui” e chamadas específicas: “Ver produto”, “Explorar peças” ou “Visitar Instagram”.
- Abrir destinos externos com segurança, sem perder o estado do aplicativo.
- Controlar frequência no Free; Premium continuará sem anúncios inseridos e terá acesso voluntário ao catálogo de parceiros, sempre identificado como relação comercial.
- Medir impressão realmente visível e clique, com deduplicação; nunca apresentar clique como venda.

## 4. Portal das lojas
- Criar cadastro de loja e responsável, verificação inicial e isolamento total entre lojas.
- Criar catálogo de produtos com imagens, categoria, descrição, preço opcional, destino e área atendida.
- Separar produto de campanha contratada.
- Implementar o fluxo: rascunho → enviada → em análise → aprovada/agendada → ativa → pausada/encerrada, incluindo reprovação com motivo.
- Exigir nova análise após mudanças relevantes e mostrar prévia antes do envio.
- Criar painel da loja com produtos, campanhas e resultados realmente medidos.
- Criar páginas públicas compartilháveis de loja e produto.

## 5. Administração e segurança
- Criar papéis em tabela separada e validação administrativa no servidor.
- Criar painel para verificar lojas, aprovar/reprovar campanhas, analisar denúncias, suspender publicações e consultar histórico de alterações.
- Aplicar permissões no banco para que lojas vejam apenas seus próprios dados e administradores executem somente ações autorizadas.
- Registrar auditoria das decisões administrativas e alterações relevantes.
- Proteger destinos, uploads e entradas inválidas; manter todas as novas tabelas com permissões e políticas de acesso explícitas.

## 6. Planos, pagamentos e operação
- Centralizar limites Free/Premium no servidor e refletir o mesmo saldo em IA, provador, planejamento e publicação.
- Adicionar processamento autenticado e idempotente dos eventos de pagamento para ativação, renovação, cancelamento e reenvios, mantendo a consulta atual como conferência.
- Registrar métricas operacionais de gerações, armazenamento, denúncias e eventos de assinatura sem expor dados pessoais.
- Atualizar Termos e Privacidade para comunidade, denúncias, lojas, campanhas, parceiros e tratamento real das fotos; remover promessas que não correspondam ao armazenamento atual.
- Criar documentação operacional para monitoramento, restauração, suporte, moderação e incidentes.

## 7. Evidências, testes e materiais de lançamento
- Testar em celular e computador: armário vazio/preenchido, três caminhos, sem intenção de compra, limites, falhas sem cobrança, salvar/trocar/ajustar, publicação, curtidas, exclusão, denúncia e imagens inválidas.
- Testar duas lojas independentes, permissões administrativas, campanhas vencidas/reprovadas, links inválidos, edição pós-aprovação e ausência de anúncios inseridos para Premium.
- Testar pagamento, cancelamento e eventos repetidos sem duplicação.
- Criar uma página interna de indicadores reais para usuários ativos, planos, retenção disponível, campanhas, impressões e cliques; separar claramente dados reais, demonstração e hipóteses.
- Preparar um roteiro de demonstração e um documento-base para investidores sem afirmar que metas são tração.
- Preparar lista de espera e medição por origem para a campanha; deixar duração, horário, orçamento, criadores, investimento buscado e responsáveis marcados como decisões pendentes do fundador.

## Dados e estrutura técnica
- Novas entidades: papéis, lojas, responsáveis, produtos, campanhas, segmentações, eventos deduplicados, denúncias, moderação, auditoria, uso diário e eventos de assinatura.
- Funções protegidas executarão limites e ações sensíveis no servidor; telas não confiarão em armazenamento do aparelho para permissões ou cotas.
- O recebimento de eventos externos usará endereços públicos com assinatura verificada e idempotência.
- Imagens de lojas/produtos terão armazenamento dedicado e regras de acesso adequadas ao estado de publicação.
- Rotas novas previstas: portal da loja, páginas públicas de loja/produto, administração/moderação e lista de espera. Todas terão títulos e descrições próprios.

## Dependências que não serão inventadas
- Não cadastrar lojas, preços, estoque, alcance, vendas, tração ou depoimentos sem dados reais.
- Antes da abertura comercial ainda serão necessários: responsável humano por revisão/suporte, orçamento, prazo das metas, investimento buscado, duração/horário da campanha e criadores contratados.
- A entrega técnica deixará esses campos configuráveis e claramente pendentes, sem apresentar planejamento como resultado alcançado.
