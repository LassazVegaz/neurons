# Notes

## 24/05/2026

The following model can nicely estimate `y = x^2` function with `[1,6,1]` layers

```json
{
  "normParams": { "standardDeviation": 1, "mean": 0 },
  "thetas": {
    "w": [
      [[-1], [-1], [-1], [1], [1], [1]],
      [[250, 1000, 700, 700, 1000, 250]]
    ],
    "b": [[0, -750, -250, -250, -750, 0], [0]]
  }
}
```
