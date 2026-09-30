# Design notes

The browser layer remains separate from deterministic core logic.

## Ring construction

Each node has a positive weight. A node receives approximately:

`round(base_virtual_nodes × weight)`

ring points. Keys are hashed once and assigned to the first clockwise ring point.

## Comparison

The same deterministic key set is placed before and after a membership change. The app reports the fraction whose owner changed under:

- ordinary modulo placement;
- consistent hashing.

Modulo placement intentionally ignores node weights so it remains a simple baseline.

## Balance metrics

The current consistent-hash assignment reports:

- key count and observed share per node;
- configured weight target;
- max/min count ratio;
- population standard deviation;
- coefficient of variation.

The metrics describe one deterministic experiment; they are not a production capacity model.
