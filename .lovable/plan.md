# Aplicar as melhorias da avaliação

## Objetivo
Transformar as recomendações do documento em uma experiência mais confiável e guiada, preservando a identidade escura e dourada do Stylisme.

## Mudanças

1. **Unificar dados e contadores**
   - Fazer Configurações carregar e salvar o mesmo nome e e-mail exibidos no perfil.
   - Exibir no perfil a quantidade real de looks publicados, separada dos looks salvos localmente.
   - Corrigir singular/plural de “dia/dias” e nomear claramente “dias no Stylisme” versus “sequência de estilo”.

2. **Guiar o primeiro uso do armário**
   - Trocar o estado vazio por um passo a passo curto: fotografar uma peça, confirmar os detalhes detectados e criar a primeira combinação.
   - Explicar antes do envio que cor, material, categoria e outros detalhes serão identificados automaticamente.
   - Manter os campos adicionais recolhidos como opcionais e editáveis.
   - Após a primeira peça, oferecer um caminho direto para adicionar outra ou gerar a primeira combinação.

3. **Eliminar caminhos sem saída**
   - No seletor vazio do provador, incluir um botão direto para cadastrar a primeira peça.
   - Antes de entrar no provador pelo feed, explicar que ele usa uma foto de corpo inteiro.
   - Diferenciar “montar com IA” de “visualizar no corpo”, deixando cada ação clara.

4. **Uniformizar limites da IA e benefícios Premium**
   - Adotar uma única regra textual: 3 gerações por dia no plano Free, com até 3 sugestões por geração.
   - Atualizar indicador, mensagens de limite, botão e comparação de planos com essa mesma unidade.
   - Destacar no Premium benefícios concretos: calendário, amostra de estatísticas, provador no corpo, sincronização e remoção de anúncios.
   - Criar acesso visível ao planejamento já existente.

5. **Reforçar confiança e comunidade**
   - Identificar publicações da marca como conteúdo editorial.
   - Dar mais destaque a “Procurar no meu armário” nos cards e detalhes de looks.
   - Informar junto às fotos como são usadas, que ficam privadas e onde podem ser apagadas.
   - Avisar na análise de cores que iluminação e câmera podem alterar o resultado.

6. **Melhorar uso no computador**
   - Ampliar as áreas de armário, feed e montagem em telas grandes, mostrando mais itens sem alterar a experiência móvel.

## Validação
- Conferir os fluxos com uma conta autenticada: perfil/configurações, armário vazio, cadastro automático, provador vazio, IA Free e Premium.
- Testar visualmente em celular e computador.
- Confirmar que todas as páginas continuam abrindo sem erros.

## Detalhes técnicos
- Manter o armazenamento atual, mas usar o perfil da conta como fonte principal para nome/e-mail.
- Consultar os looks publicados para o contador público, sem misturá-los aos looks privados locais.
- Reaproveitar os fluxos existentes de cadastro, geração, provador e planejamento; não criar novas funções fora do escopo.
