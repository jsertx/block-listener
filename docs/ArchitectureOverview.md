Everything starts in the BlockListener usecase. It will listen blockchain blocks with the json rpc provider.
All the communications are asyncrhonous via RabbitMQ to avoid losing data and increase availability.

```mermaid
graph TD
    RPC((RPC)) -.->|block| BlockListener(BlockListener)
    BlockListener -.->|block| FindDirectTx[FindDirectTx]
    BlockListener -.->|block| FindInternalTx[FindInternalTx]
    FindDirectTx -.-> |tx|SaveTx
    FindInternalTx -.-> |tx|SaveTx
    
    SaveTx -.->|token| SaveToken
    SaveTx -.->|wallet| SaveWhale
```

