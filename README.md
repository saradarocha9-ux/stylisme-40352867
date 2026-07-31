# Stylisme: Your Wardrobe AI

STYLISME

Documento de Desenvolvimento

Parte 3 de 5

29. STYLISME FREE

Todo novo usuário deve iniciar automaticamente no plano Stylisme Free.

O plano gratuito deve ser útil e completo, permitindo que qualquer pessoa conheça a experiência do aplicativo antes de decidir assinar.

Recursos incluídos

 Cadastro de roupas ilimitado.

 Remoção automática do fundo das roupas.

 Guarda-roupa digital.

 Avatar personalizado.

 Criação básica de looks.

 Visualização dos looks no avatar.

 Favoritos.

 Perfil.

 Configurações.

 Sincronização dos dados.

 Backup das roupas cadastradas.

 Compartilhamento de looks.

Na área do perfil, exibir claramente:

Plano Atual

Stylisme Free

Adicionar um botão:

Conheça o Stylisme Premium

30. STYLISME PREMIUM

Criar uma tela exclusiva para apresentação do plano Premium.

Ela deve ter aparência sofisticada.

Utilizar animações suaves.

Cards elegantes.

Ícones minimalistas.

Espaçamentos amplos.

Explicar claramente todas as vantagens.

Nome

Stylisme Premium

Valor

R$ 24,90 por mês

Valor fixo.

Sem planos diferentes.

Sem preços confusos.

Benefícios

Ao assinar o Premium, o usuário recebe:

 IA ilimitada para criação de looks.

 Planejamento semanal.

 Planejamento mensal.

 Recomendações inteligentes.

 Análise automática do guarda-roupa.

 Estatísticas completas de uso das roupas.

 Backup em nuvem.

 Sincronização entre dispositivos.

 Recursos exclusivos lançados primeiro.

 Melhor desempenho nas análises inteligentes.

Comparação

Criar uma comparação elegante.

Stylisme Free

✅ Cadastro de roupas

✅ Guarda-roupa digital

✅ Avatar

✅ Criação básica de looks

✅ Favoritos

✅ Perfil

Stylisme Premium

✅ Tudo do Free

✅ IA ilimitada

✅ Planejamento inteligente

✅ Estatísticas

✅ Recomendações avançadas

✅ Recursos exclusivos

✅ Sincronização completa

Adicionar um botão grande:

Assinar Premium

31. SISTEMA DE PAGAMENTO

O sistema de assinatura deve ser totalmente funcional.

Utilizar integração com o Stripe para gerenciar pagamentos e assinaturas.

Toda a lógica de cobrança deve utilizar a API oficial do Stripe.

A integração deve ser preparada para ambiente de produção.

Métodos de pagamento

Permitir:

 Cartão de crédito

 Cartão de débito (quando disponível)

 Google Pay

 Apple Pay

Caso a estratégia do projeto inclua PIX por meio de um provedor compatível conectado ao Stripe ou a outro gateway configurado posteriormente, a arquitetura deve permitir essa integração sem necessidade de refazer o sistema.

Fluxo

Usuário entra na tela Premium.

↓

Visualiza benefícios.

↓

Clica em

Assinar Premium

↓

Escolhe a forma de pagamento.

↓

Realiza o pagamento.

↓

O Stripe confirma a transação.

↓

O aplicativo atualiza automaticamente o plano.

↓

Todos os recursos Premium são liberados imediatamente.

32. GERENCIAMENTO DA ASSINATURA

Criar uma área chamada:

Minha Assinatura

Mostrar:

Plano atual.

Status.

Valor.

Próxima cobrança.

Data da assinatura.

Método de pagamento.

Botão:

Gerenciar assinatura.

Permitir:

Atualizar cartão.

Cancelar renovação automática.

Visualizar histórico.

Restaurar assinatura quando aplicável.

Mostrar mensagens claras para qualquer alteração.

33. BANCO DE DADOS

Utilizar Firebase.

Cloud Firestore.

Firebase Authentication.

Firebase Storage.

Toda informação deve ser salva automaticamente.

Nunca utilizar armazenamento temporário.

Coleção

Users

Campos:

 userId

 nome

 email

 fotoPerfil

 avatar

 plano

 assinaturaAtiva

 dataCadastro

 idioma

 notificações

Subcoleção

Roupas

Campos:

 roupaId

 categoria

 cor

 estampa

 ocasião

 estação

 imagemOriginal

 imagemSemFundo

 favorita

 dataCadastro

Subcoleção

Looks

Campos:

 lookId

 nome

 roupasSelecionadas

 imagemPreview

 favorito

 dataCriação

Subcoleção

Planejamentos

Campos:

 data

 horário

 observação

 lookSelecionado

34. FIREBASE STORAGE

Salvar:

Foto de perfil.

Foto do corpo inteiro.

Imagem original da roupa.

Imagem com fundo removido.

Miniaturas.

Imagens dos looks.

Organizar automaticamente em pastas por usuário.

35. SINCRONIZAÇÃO

Sempre que o usuário alterar alguma informação.

Atualizar imediatamente o banco.

Caso ele troque de celular.

Ao fazer login.

Todas as informações devem ser restauradas automaticamente.

Inclusive:

 roupas;

 avatar;

 favoritos;

 planejamentos;

 perfil;

 looks.

36. PERFIL

Mostrar:

Foto.

Nome.

Email.

Plano atual.

Quantidade de roupas.

Quantidade de looks.

Quantidade de favoritos.

Dias utilizando o Stylisme.

Botão:

Editar Perfil.

Botão:

Minha Assinatura.

Botão:

Configurações.

Tudo funcionando.

37. CONFIGURAÇÕES

Criar uma tela elegante.

Permitir alterar:

 foto;

 nome;

 idioma;

 notificações;

 tema claro;

 tema escuro;

 senha;

 privacidade.

Adicionar:

Exportar meus dados.

Excluir minha conta.

Sair.

Todos os botões devem executar suas funções corretamente.

38. OBJETIVO

Todo o sistema Premium deve ser totalmente integrado.

O aplicativo deve reconhecer automaticamente quando um usuário assina, renova, cancela ou perde o acesso ao plano Premium, atualizando os recursos disponíveis em tempo real.

A experiência de assinatura deve ser simples, segura e transparente, com foco em confiabilidade e facilidade de uso.

Fim da Parte 3

Na Parte 4, será detalhado o funcionamento da Inteligência Artificial, o sistema de recomendações, análise do guarda-roupa, geração de looks personalizados, clima, notificações inteligentes, animações, desempenho e todas as regras de funcionamento para deixar o Stylisme com uma experiência de nível profissional.

4

STYLISME

Documento de Desenvolvimento

Parte 4 de 5

39. INTELIGÊNCIA ARTIFICIAL

A Inteligência Artificial será o principal diferencial do Stylisme.

Ela deve aprender continuamente com o comportamento do usuário para oferecer sugestões cada vez mais personalizadas.

A IA deve considerar:

 roupas cadastradas;

 estilo informado no cadastro;

 looks criados anteriormente;

 roupas favoritas;

 roupas mais utilizadas;

 roupas menos utilizadas;

 estação do ano;

 clima (quando autorizado);

 ocasiões.

Toda recomendação deve ser personalizada.

Nunca gerar sugestões aleatórias.

40. ASSISTENTE STYLISME AI

Criar um assistente inteligente dentro do aplicativo.

Nome:

Stylisme AI

Ele será responsável por ajudar o usuário.

Exemplos de perguntas:

"Qual look combina para hoje?"

"O que posso usar em um casamento?"

"Monte um look elegante."

"Tenho uma entrevista amanhã."

"Quero um look confortável."

"O que combina com esta saia?"

"O que posso usar com esta calça?"

A IA deve responder utilizando exclusivamente as roupas cadastradas pelo usuário.

Nunca sugerir roupas que não existam no guarda-roupa.

41. GERAÇÃO DE LOOKS

Ao clicar em:

Gerar Look

Perguntar:

Qual ocasião?

 Trabalho

 Faculdade

 Casual

 Festa

 Casamento

 Viagem

 Evento

 Academia

 Praia

 Jantar

Perguntar:

Qual estilo?

 Elegante

 Minimalista

 Streetwear

 Casual

 Fashionista

 Vintage

 Romântico

 Esportivo

Perguntar:

Existe alguma peça obrigatória?

Selecionar roupa.

Perguntar:

Existe alguma peça que você não deseja utilizar?

Selecionar roupa.

Perguntar:

Deseja utilizar acessórios?

Sim

Não

Após responder.

A IA analisa todo o guarda-roupa.

Em seguida gera o look.

42. VISUALIZAÇÃO DO LOOK

Após gerar.

Vestir automaticamente o avatar.

Mostrar:

Avatar

↓

Look completo

↓

Lista das roupas utilizadas

↓

Paleta de cores

↓

Ocasião

↓

Botões:

Salvar

Editar

Favoritar

Compartilhar

Gerar outro

Todos funcionando.

43. ANÁLISE DO GUARDA-ROUPA

A IA deve analisar automaticamente:

Quantidade de roupas.

Cores predominantes.

Categorias.

Peças repetidas.

Peças nunca utilizadas.

Peças favoritas.

Combinações possíveis.

Estação.

Ocasiões.

Criar relatórios inteligentes.

44. ESTATÍSTICAS

Criar uma tela elegante.

Mostrar:

Quantidade de roupas.

Quantidade de looks.

Cor mais utilizada.

Categoria mais utilizada.

Marca mais utilizada.

Peça mais utilizada.

Peça menos utilizada.

Peças esquecidas.

Quantidade de combinações criadas.

Dias utilizando o aplicativo.

Essas informações devem atualizar automaticamente.

45. RECOMENDAÇÕES

A IA deve sugerir:

"Você ainda não utilizou esta peça este mês."

"Essa blusa combina com três calças do seu guarda-roupa."

"Você costuma usar muito preto. Que tal experimentar tons claros?"

"Você criou poucos looks utilizando esta saia."

"Este vestido combina com aquele blazer."

As recomendações devem ser úteis.

Nunca repetitivas.

46. CALENDÁRIO INTELIGENTE

Criar um calendário elegante.

O usuário poderá:

Planejar looks.

Criar compromissos.

Associar um look a uma data.

Editar.

Excluir.

Duplicar planejamentos.

Tudo salvo automaticamente.

47. CLIMA

Caso o usuário permita acesso à localização.

Obter automaticamente:

Temperatura.

Condição climática.

Chance de chuva.

Com base nisso.

A IA poderá adaptar os looks sugeridos.

Exemplos:

Está frio hoje.

Está muito quente.

Há previsão de chuva.

O clima deve servir apenas como apoio às recomendações.

48. FAVORITOS

Criar uma tela exclusiva.

Separar:

Roupas favoritas.

Looks favoritos.

Busca rápida.

Filtros.

Tudo sincronizado.

49. PESQUISA INTELIGENTE

Criar uma pesquisa global.

Permitir pesquisar:

Nome da roupa.

Categoria.

Cor.

Ocasião.

Estação.

Marca.

Resultados instantâneos.

50. NOTIFICAÇÕES

Enviar notificações úteis.

Exemplos:

Seu look de hoje está pronto.

Você ainda não utilizou esta peça este mês.

Hoje fará frio.

Que tal usar aquele casaco?

Você criou um novo look ontem.

Planejamento para amanhã disponível.

Permitir ativar ou desativar.

51. ANIMAÇÕES

Todas as telas devem possuir animações suaves.

Utilizar:

Fade.

Slide.

Scale.

Hero Animation.

Skeleton Loading.

Ripple.

Shimmer.

Evitar animações exageradas.

Tudo deve parecer elegante.

52. DESEMPENHO

O aplicativo deve ser extremamente rápido.

Implementar:

Cache de imagens.

Lazy Loading.

Compressão automática.

Carregamento assíncrono.

Atualizações em tempo real quando necessário.

53. RESPONSIVIDADE

Compatível com:

Android.

iPhone.

Tablets.

Todos os layouts devem se adaptar automaticamente.

54. MODO ESCURO

Criar:

Tema Claro.

Tema Escuro.

Seguir sistema.

Toda a interface deve mudar automaticamente.

55. ACESSIBILIDADE

Implementar:

Compatibilidade com leitores de tela.

Fontes ajustáveis.

Bom contraste.

Botões grandes.

Boa navegação.

56. EXPERIÊNCIA PREMIUM

Toda a experiência deve transmitir qualidade.

Nenhuma tela deve parecer simples ou genérica.

O aplicativo deve dar a sensação de estar utilizando um produto de luxo.

Cada detalhe da interface deve demonstrar cuidado.

As transições devem ser fluidas.

As telas devem ser organizadas.

A navegação deve ser intuitiva.

Fim da Parte 4

Na Parte 5, será criada a documentação final com regras gerais do projeto, testes, validações, tratamento de erros, requisitos para publicação na App Store e Google Play, checklist completo de qualidade e todas as orientações finais para que o Stylisme esteja pronto para produção e lançamento comercial.

5

STYLISME

Documento de Desenvolvimento

Parte 5 de 5

57. REGRAS GERAIS DO PROJETO

O Stylisme deve ser desenvolvido como um aplicativo comercial de alto nível.

O objetivo não é criar apenas um protótipo ou uma demonstração.

Todo o aplicativo deve estar preparado para publicação na App Store e Google Play.

Toda funcionalidade apresentada ao usuário deve funcionar corretamente.

Nenhuma tela deve conter informações falsas ou botões sem ação.

58. FUNCIONAMENTO DOS BOTÕES

Todos os botões do aplicativo devem executar exatamente a função para a qual foram criados.

Exemplos:

Entrar

Criar Conta

Editar Perfil

Adicionar Roupa

Excluir Roupa

Criar Look

Salvar Look

Favoritar

Compartilhar

Planejar

Alterar Senha

Minha Assinatura

Configurações

Logout

Exportar Dados

Excluir Conta

Todos devem estar conectados às suas respectivas ações.

Nunca deixar um botão apenas como elemento visual.

59. VALIDAÇÕES

Todos os formulários devem possuir validações completas.

Exemplos:

Não aceitar e-mail inválido.

Não aceitar senha vazia.

Não aceitar cadastro incompleto.

Não aceitar campos obrigatórios em branco.

Não permitir dados inconsistentes.

Mostrar mensagens amigáveis para cada erro encontrado.

60. TRATAMENTO DE ERROS

Sempre que ocorrer algum erro.

Mostrar mensagens claras.

Exemplos:

"Não foi possível conectar ao servidor."

"Tente novamente em alguns instantes."

"Verifique sua conexão com a internet."

"Não foi possível salvar esta roupa."

"Nenhuma roupa encontrada."

Nunca mostrar mensagens técnicas para o usuário final.

Registrar erros internamente para facilitar futuras correções.

61. SINCRONIZAÇÃO

Sempre que existir conexão.

Sincronizar automaticamente:

Perfil.

Guarda-roupa.

Favoritos.

Looks.

Planejamentos.

Configurações.

Caso o usuário utilize outro dispositivo.

Ao fazer login.

Todos os dados deverão aparecer automaticamente.

62. BACKUP

Criar backup automático.

Sempre que o usuário:

Adicionar roupa.

Editar roupa.

Criar look.

Editar perfil.

Alterar configurações.

Tudo deverá ser salvo automaticamente.

Nenhuma informação poderá ser perdida.

63. QUALIDADE DA INTERFACE

Todo o aplicativo deve seguir o mesmo padrão visual.

Mesmo estilo de:

Botões.

Cards.

Ícones.

Tipografia.

Espaçamentos.

Sombras.

Animações.

Não permitir telas com aparência diferente.

Toda a identidade visual deve permanecer consistente.

64. DESEMPENHO

O aplicativo deve iniciar rapidamente.

As imagens devem carregar rapidamente.

Utilizar cache.

Lazy Loading.

Compressão.

Atualizações inteligentes.

Evitar qualquer travamento.

65. PUBLICAÇÃO

Preparar toda a estrutura para publicação.

Android.

iPhone.

Ícone.

Splash Screen.

Nome.

Versão.

Permissões.

Certificados.

Tudo organizado.

66. SEGURANÇA

Garantir que:

Cada usuário acesse apenas seus próprios dados.

Fotos sejam privadas.

Informações pessoais permaneçam protegidas.

Toda comunicação utilize HTTPS/TLS.

Seguir as melhores práticas do Firebase.

Seguir integralmente a LGPD.

67. ACESSIBILIDADE

O aplicativo deve ser utilizável por diferentes perfis de usuários.

Implementar:

Leitor de tela.

Fontes ajustáveis.

Bom contraste.

Botões acessíveis.

Navegação intuitiva.

68. ESCALABILIDADE

O projeto deve ser organizado para permitir futuras expansões sem necessidade de reconstruir a arquitetura.

Novas funcionalidades poderão ser adicionadas futuramente.

Exemplos:

Marketplace.

Consultoria de moda.

Integração com novas IAs.

Novos planos.

Novos idiomas.

Programa de fidelidade.

Sistema de recompensas.

Integração com outras plataformas.

69. CÓDIGO

Gerar código limpo.

Organizado.

Modular.

Reutilizável.

Evitar duplicação de componentes.

Criar componentes reutilizáveis para:

Botões.

Cards.

Campos de texto.

Menus.

Diálogos.

Modais.

Tudo deve seguir boas práticas de desenvolvimento.

70. TESTES

Antes de considerar o projeto concluído, verificar cuidadosamente:

 Cadastro funcionando.

 Login funcionando.

 Recuperação de senha funcionando.

 Logout funcionando.

 Perfil funcionando.

 Cadastro de roupas funcionando.

 Remoção automática do fundo funcionando.

 Avatar funcionando corretamente.

 Criação de looks funcionando.

 IA gerando sugestões.

 Favoritos funcionando.

 Planejador funcionando.

 Sincronização funcionando.

 Assinatura Premium funcionando.

 Pagamentos via Stripe funcionando.

 Banco de dados salvando corretamente.

 Nenhum botão sem ação.

 Nenhuma tela quebrada.

 Nenhum erro visual.

 Nenhum texto de exemplo ("Lorem Ipsum") ou conteúdo temporário visível.

71. QUALIDADE FINAL

Antes da entrega, revisar todo o aplicativo.

Corrigir qualquer problema encontrado.

Garantir consistência visual.

Garantir excelente experiência do usuário.

Garantir ótimo desempenho.

Garantir segurança.

Garantir organização.

O aplicativo deve transmitir profissionalismo em todos os detalhes.

72. OBJETIVO FINAL

O Stylisme deve ser um aplicativo moderno, elegante e totalmente funcional, oferecendo uma experiência premium desde o primeiro acesso.

O usuário deve conseguir organizar seu guarda-roupa digital, cadastrar suas roupas, remover automaticamente o fundo das imagens, experimentar combinações em seu avatar 2D, planejar looks, receber recomendações inteligentes e gerenciar sua assinatura com facilidade.

Todas as funcionalidades devem estar integradas entre si, utilizando Firebase para autenticação e armazenamento dos dados, APIs para Inteligência Artificial e remoção de fundo, além do Stripe para gerenciamento seguro das assinaturas.

O resultado esperado é um aplicativo pronto para produção, escalável, seguro, intuitivo e visualmente refinado, com qualidade comparável aos principais aplicativos internacionais de moda e lifestyle.

73. ENTREGA

O projeto somente será considerado concluído quando:

 Todas as telas estiverem implementadas.

 Todos os botões estiverem funcionando.

 Todas as integrações estiverem configuradas.

 Todos os dados estiverem sendo salvos corretamente.

 O design seguir a referência enviada.

 O plano Stylisme Free e o Stylisme Premium estiverem totalmente operacionais.

 A experiência do usuário for consistente em todo o aplicativo.

 O aplicativo estiver pronto para publicação nas lojas oficiais, sem funcionalidades incompletas ou elementos apenas ilustrativos. deve haver uma pagina de looks para criar looks automaticamente pela IA dependendo do clima lugar que vai etc, nao deixe perder NENHUM detalhe. aqui esta a logo, e o inicio nao deve ter convite nem nada, só o splash do stylisme com um fade in na logo e stylisme escrito depois inteligência para o seu armário.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://stylisme.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2280568c-c1a9-46ef-845e-353f486d8778).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
