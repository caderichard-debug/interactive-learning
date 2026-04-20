/** Single source for home + sidebar chapter list (only routes with pages in repo). */
export const homeChapters = [
  { title: 'Convolutional Networks', href: '/chapters/convolutional-networks', desc: 'Watch a kernel slide over an 8×8 input and compute feature maps one step at a time.', num: '06' },
  { title: 'Loss Functions', href: '/chapters/loss-functions', desc: 'Compare MSE, MAE, Huber, and cross-entropy — see how gradients differ at every point.', num: '07' },
  { title: 'Softmax & Temperature', href: '/chapters/softmax', desc: 'Turn logits into probabilities; dial temperature to sharpen or flatten the distribution.', num: '08' },
  { title: 'Regularization', href: '/chapters/regularization', desc: 'See L1 vs L2 penalties shift the optimum away from the data-only solution as λ changes.', num: '09' },
  { title: 'Encoder–Decoder', href: '/chapters/encoder-decoder', desc: 'Map the two-stack pattern: encoder → bottleneck context → decoder for seq2seq and beyond.', num: '10' },
  { title: 'Residual & Skips', href: '/chapters/residual-connections', desc: 'Compare plain depth vs residual highways with a toy gradient view and F(x)+x block diagram.', num: '11' },
  { title: 'Normalization Layers', href: '/chapters/normalization-layers', desc: 'See LayerNorm vs BatchNorm axes on a batch×feature grid — where each normalizes in the tensor.', num: '12' },
] as const;
