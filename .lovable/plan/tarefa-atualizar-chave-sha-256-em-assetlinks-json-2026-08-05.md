# Tarefa: Atualizar chave SHA-256 em assetlinks.json

## Contexto
O usuário quer usar outra chave (a chave 1 já foi usada) no arquivo de Digital Asset Links do Android.

## Novo valor fornecido
- SHA-256: `4E:E7:3B:35:78:35:CC:84:89:F9:04:7F:24:69:9A:E5:D7:D5:B6:4A:B5:56:46:73:58:BF:C2:3F:4D:D6:1D:DB`

## Plano de execução
1. Ler o arquivo atual `public/.well-known/assetlinks.json`.
2. Adicionar uma nova entrada com a nova chave SHA-256 (mantendo a entrada antiga para garantir compatibilidade, já que o JSON suporta múltiplas declarações).
3. Verificar se o JSON continua válido e se o domínio `stylisme.company` continua apontando corretamente.

## Arquivos envolvidos
- `public/.well-known/assetlinks.json`
