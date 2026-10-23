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

## Gargalos ainda não resolvidos

1. Estatísticas baixam eventos brutos limitados em vez de agregados. Totais podem ficar incompletos em períodos de alto volume; mover os cálculos para consultas agregadas protegidas antes do crescimento.
2. Feed sem paginação e lista de seguidores enviada como IDs: implementar paginação por cursor e consulta de seguidores no servidor.
3. Fotos do armário em base64 dentro de um único armazenamento local: migrar fotos para armazenamento de objetos e manter referências, com avisos de falha de gravação.
4. Chamadas de IA precisam de limites de tamanho de conteúdo, tempo máximo, controle de concorrência e monitoramento de custo. Não truncar a seleção de peças nem alterar quotas comerciais para resolver isso.
5. Revisar filas e recuperação de falhas para geração de imagens e processamento de pagamentos.

## Critérios para validar grande escala

- Definir meta de acessos simultâneos, ações por segundo, regiões e proporção de usos do provador.
- Criar ambiente isolado com dados sintéticos representativos, sem dados pessoais ou pagamentos reais.
- Medir latências p50/p95/p99, erros, memória, conexões, consultas e custo por ação em carga crescente e teste prolongado.
- Ensaiar falha do provedor de IA, repetição de pagamento, recuperação e isolamento entre contas.
- Ajustar capacidade do Lovable Cloud conforme medições, com aprovação de custos; hoje não há sinal que justifique aumento imediato.
- Só divulgar capacidade que os testes demonstraram. Não executar carga pesada no ambiente que atende os usuários.