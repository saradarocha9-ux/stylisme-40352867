# Roadmap

## Capacidade
- [x] Auditar gargalos de consultas, imagens e IA; índices de busca e comércio aplicados e confirmados; limitações documentadas em CAPACIDADE.md.
- [x] Substituir estatísticas brutas por agregados, paginar feed e consultar Seguindo no banco; fotos fora do JSON local em blobs privados IndexedDB. Consulta, paginação e gravação/recuperação verificadas com sessão real.
- [x] Limitar tamanho/tempo das chamadas de IA e impedir envio concorrente por conta sem alterar provas diárias; testes e trava real conferidos.
- [x] Tornar registro de eventos Stripe e atualização de acesso atômicos, com reconciliação e proteção contra repetição/atrasos. Endpoint sem assinatura rejeitado; pagamento real permanece pendente abaixo.
- [ ] Validar filas globais de IA, resumos incrementais de eventos e carregamento de fotos sob demanda — depende das metas e do orçamento definidos no teste isolado de capacidade.
- [ ] Certificar capacidade em grande escala — depende de teste de carga em ambiente isolado, meta de usuários simultâneos e orçamento de infraestrutura/IA.

- [x] Corrigir a experiência de “Seu próximo look” e aplicar limites de IA no servidor.
- [x] Implementar “Inspire-se” com salvar, exportar, denúncia e moderação.
- [x] Implementar segmentação básica por cidade, vigência e intervalo de uma hora entre anúncios inseridos.
- [x] Criar portal de lojas, produtos, imagens e fluxo de campanhas com revisão.
- [x] Criar administração com papéis separados, proteção de assinatura e auditoria.
- [x] Fechar chamadas diretas que escapavam dos limites Free nas ferramentas inteligentes e reforçar envio de imagens de lojas.
- [ ] Validar pagamento real, confirmação, cancelamento e repetição de eventos do processador.
- [x] Atualizar termos, privacidade, operação, lista de espera e materiais sem apresentar metas como resultados.
- [ ] Medir custo real de IA, armazenamento, suporte, moderação e capacidade.
- [ ] Testar isolamento entre duas lojas, campanhas vencidas/reprovadas, edição após aprovação e destinos inválidos.
- [ ] Validar quotas e moderação com contas Free, Premium e administradora separadas.
- [ ] Fazer teste guiado com pessoas novas e com armários vazios e pequenos.

## Dependências externas

- [ ] Definir responsáveis humanos por revisão, suporte, moderação e vendas.
- [ ] Definir orçamento, prazo das metas e investimento buscado.
- [ ] Escolher duração/horário da campanha e contratar criadores.

- [x] Criar mais looks variados/alternativos jovens no Inspire-se (conta oficial, 0 curtidas)
- [x] Criar novos editoriais variados e publicar pelo Stylisme com curtidas reais (4 publicados, foto e abertura verificadas).
- [x] Dar mais espaço visual à barra inferior no celular mantendo Lojas no meio (verificado em 390px).
- [x] Adicionar pesquisa de usuários e looks no Inspire-se; pesquisar lojas somente na aba Lojas (busca e abertura verificadas; lojas sem registros disponíveis).
- [x] Criar e publicar 30 novos editoriais: 5 por estilo, seis estilos variados, pela conta oficial e sem curtidas artificiais.
- [x] Refazer os 5 alternativos extras com visual punk/goth/grunge marcante (não casual), depois criar 5 casuais; 40 publicados, contagens confirmadas e fotos goth/casual abertas no app com sessão real.
- [x] Criar mais cinco editoriais de pets com roupinhas normais e intercalar entre os looks no feed; cinco fotos e abertura verificadas com sessão real.

## Moedas, idiomas e gosto
- [x] Premium 24,90 em BRL, USD e EUR; planos de loja também em USD/EUR
- [ ] Seletor de idioma: pt, en, es, it, ko, zh, fr, ru (app inteiro, em etapas) — seletor + barra + Premium feitos; demais telas pendentes
- [x] "Não tenho interesse" nos looks do Inspire-se para aprender o gosto

## Provador
- [x] Manter a foto vestida ao trocar de aba e voltar; persistência de imagem de teste e remoção explícita verificadas com sessão real, sem gerar outra prova; três testes aprovados.
- [x] Esclarecer a diferença entre provas do usuário e indisponibilidade do serviço; referência a créditos retirada do aviso do provador, sem alterar quotas.
- [x] Retirar os links e formulário da lista de espera; acesso direto e redirecionamento dos links antigos conferidos no navegador.
- [x] Escolher várias peças sem geração automática e vestir juntas somente ao enviar; seis peças preservadas após recarregar e um único envio explícito verificados com sessão real; testes de seleção acima de cinco aprovados.
- [ ] Confirmar a foto final da prova em lote — bloqueado pela indisponibilidade do serviço no teste anterior; não é esgotamento das provas do usuário.
