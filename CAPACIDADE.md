# Capacidade do Stylisme

## Resultado da verificação — 23/10/2026

Não existe certificação para milhões de usuários ou garantia de ausência de falhas. Milhões de contas cadastradas são diferentes de milhões de acessos simultâneos. Não foi executado teste de carga contra produção.

O Lovable Cloud estava saudável na verificação: memória 59%, disco 15%, conexões 11/60, clientes do pool 5/200, sem reinícios ou alertas recentes de esgotamento. Isso descreve a carga atual, não a capacidade futura.

## Melhorias aplicadas

- Índices de busca por trechos de nome/@usuário e título, legenda e autor de looks.
- Índice de categoria/data para publicações não suspensas.
- Índice de campanha/data para consultas de eventos por período.
- Índices para lojas verificadas por nome e produtos publicados por loja/data.
- Permissões, isolamento, preços e limites dos planos mantidos.
- Feed carregado em páginas de 24 looks por cursor; a aba Seguindo consulta o relacionamento no banco, sem baixar todos os IDs.
- Estatísticas de lojas calculadas no banco com permissões existentes; totais não dependem mais de um limite de eventos baixados.
- Fotos privadas do armário guardadas como blobs no IndexedDB do aparelho; JSON local mantém referências. Isso não é sincronização entre aparelhos nem backup na nuvem.
- Pedidos de IA com teto de conteúdo, resposta e espera (120 segundos por chamada), sem corte silencioso das peças do provador; um pedido em andamento por conta, com trava expirada após dez minutos caso haja interrupção.
- Pagamentos: assinatura conferida no Stripe; registro do evento e atualização de acesso na mesma transação, com deduplicação e controle de ordem.
- Verificação autenticada: mais looks carregados, fotos gravadas/recuperadas, estatísticas agregadas consultadas, segunda solicitação concorrente bloqueada e aviso de pagamento sem assinatura rejeitado. Dez testes automatizados aprovados. Nenhum pagamento real nem carga pesada executados.

## Gargalos ainda não resolvidos

1. Capacidade global de IA, limites do provedor e filas duráveis precisam de um orçamento e meta de simultaneidade; a trava por conta não é um limitador global.
2. Estatísticas agregadas ainda consultam os eventos do período: em volumes muito grandes, medir e avaliar resumos incrementais e retenção de eventos.
3. Fotos ainda são hidratadas na memória para compatibilidade com o app. Falta carregamento sob demanda e backup/sincronização entre aparelhos. O navegador pode limitar ou remover armazenamento local; fechamento durante gravação não é confirmação de durabilidade.
4. Listas administrativas e perfis individuais precisam ser avaliados com dados sintéticos grandes; a paginação aplicada nesta etapa é a do Inspire-se.
5. Pagamento real, eventos assinados repetidos/fora de ordem e recuperação após falhas precisam ser ensaiados no ambiente de teste do processador, sem alterar assinaturas reais.

## Critérios para validar grande escala

- Definir meta de acessos simultâneos, ações por segundo, regiões e proporção de usos do provador.
- Criar ambiente isolado com dados sintéticos representativos, sem dados pessoais ou pagamentos reais.
- Medir latências p50/p95/p99, erros, memória, conexões, consultas e custo por ação em carga crescente e teste prolongado.
- Ensaiar falha do provedor de IA, repetição de pagamento, recuperação e isolamento entre contas.
- Ajustar capacidade do Lovable Cloud conforme medições, com aprovação de custos; hoje não há sinal que justifique aumento imediato.
- Só divulgar capacidade que os testes demonstraram. Não executar carga pesada no ambiente que atende os usuários.