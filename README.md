# fumadocs-twoslash 4: hover types are no longer truncated

A bare `create-fumadocs-app` (Next.js + Fumadocs MDX) with `fumadocs-twoslash` set up as in the
[Twoslash docs](https://fumadocs.dev/docs/markdown/twoslash). The only page that matters is
[`content/docs/fields.mdx`](content/docs/fields.mdx): one code block that hovers `fields`, an object
with 30 factory methods.

`fumadocs-twoslash` 4 builds hover text with `NodeBuilderFlags.NoTruncation`
(`packages/twoslash/src/twoslasher.ts`, fuma-nama/fumadocs#3533), so every hover of `fields` renders
its full type. 3.x used the TypeScript language service, which collapses long types
(`... 26 more ...`). Each popup is highlighted into JSX, so the page payload grows with it.

## Reproduce

```bash
pnpm install
pnpm build
pnpm hover-report   # popup text sizes + page size of /docs/fields
```

Or run `pnpm dev`, open `/docs/fields` and hover `fields`.

To compare with 3.x, check out the `twoslash-v3` branch (only `fumadocs-twoslash` differs) and run
the same commands.

## Result

| `/docs/fields` (4 lines of code) | `twoslash-v3` (3.3.1) | `main` (4.0.1) |
| -------------------------------- | --------------------- | -------------- |
| `fields` hover text              | 626 chars             | 6,715 chars    |
| Page HTML                        | 131 KB                | 609 KB         |
| Page RSC payload                 | 90 KB                 | 493 KB         |

`fields` is hovered 4 times. In a real docs site with a few dozen such hovers, the compiled MDX grew
from 28 MB to 122 MB and the `next build` main process from 3.5 GB to 7.2 GB.

<details>
<summary>The <code>fields</code> hover with 3.3.1</summary>

```ts
const fields: {
    text: (options?: FieldOptions, validation?: ValidationOptions) => {
        kind: "text";
        options: FieldOptions | undefined;
        validation: ValidationOptions | undefined;
    };
    textarea: (options?: FieldOptions, validation?: ValidationOptions) => {
        kind: "textarea";
        options: FieldOptions | undefined;
        validation: ValidationOptions | undefined;
    };
    email: (options?: FieldOptions, validation?: ValidationOptions) => {
        ...;
    };
    ... 26 more ...;
    signature: (options?: FieldOptions, validation?: ValidationOptions) => {
        ...;
    };
}
```

With 4.0.1 the same hover lists all 30 members in full.

</details>
