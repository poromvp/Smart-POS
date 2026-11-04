This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

The customer ordering flow uses the Next.js proxy for the catalog and order/KDS
APIs by default. Override `NEXT_PUBLIC_API_URL` or
`NEXT_PUBLIC_SALES_API_URL` when deploying the frontend separately.

For real QR scanning on a phone, start Next.js so it is reachable on the LAN:

```powershell
npm run dev -- --hostname 0.0.0.0
```

In the admin QR screen, enter the computer's LAN URL (for example
`http://192.168.1.10:3000`) in **Địa chỉ frontend cho điện thoại**. The generated
QR then opens `/menu?table=...` on the phone.

The public `/menu` link from the login page is view-only. Customers can select
items, open the cart, and submit an order only after opening the table-specific
URL from a QR code.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
