## 1. Introduction

FounderBacon ("we", "our", "us") operates the website founderbacon.com and the FounderBacon API at api.founderbacon.com. This Privacy Policy explains how we collect, use, and protect your information when you use our services.

## 2. Information we collect

**Public API usage (no account required):**

- We do not collect any personal information from users of our public API.
- We may log IP addresses and request metadata for rate limiting and abuse prevention purposes.
- No API key is required to use our public endpoints.

**Account creation (Login with Epic Games):**

- When you log in via Epic Games OAuth, we receive your Epic Games display name and account ID.
- Epic Games does not share your email address with us.
- We store your display name, account ID, and account creation date to provide our services (builds, favorites, etc.).

**Feedback submissions:**

When you submit feedback via the /feedback page, we collect:

- Subject, message, and optional rating (1-5).
- Optional display name and contact email if you provide them. If you are logged in via Epic Games, your Epic display name is used by default.
- Up to four image attachments (screenshots) you choose to upload.
- The page URL you were on, the resource context (`scope` parameter), and your browser's user agent and locale, attached automatically to help us reproduce issues.
- A hashed version of your IP address, used solely for rate limiting (5 submissions per hour per IP). Raw IP addresses are not stored.

Feedback content is not public. It is read only by the FounderBacon team for triage and improvement purposes.

**Usage analytics:**

We collect anonymous, aggregate usage events to understand which content is popular and to prioritize improvements. These events include:

- Item views (`weapon.viewed`, `trap.viewed`, `hero.viewed`, `survivor.viewed`, etc.).
- Stat calculation events when you use the build tools (`weapon.calculated`, `trap.calculated`).

These events contain only the type of action and the affected item slug. They do not contain any personal information, account identifier, or session token.

## 3. How we use your information

We use the information we collect to:

- Provide and maintain our services
- Associate your saved builds and favorites with your account
- Display your Epic Games display name on shared builds
- Read and respond to feedback you submit
- Aggregate anonymous usage data to improve features and prioritize new content
- Monitor and prevent abuse of our API and feedback form
- Improve our services

## 4. Data sharing

We do not sell, trade, or rent your personal information to third parties. We may share information only in the following cases:

- When required by law or legal process
- To protect our rights and safety
- With your explicit consent

## 5. Data storage and infrastructure

- Your account data, feedback, and usage events are stored on MongoDB Atlas servers, with encrypted connections and secure authentication.
- Static assets (icons, images, screenshots) are served from our CDN at cdn.founderbacon.com.
- The website itself is hosted on Vercel, which may collect basic request metadata (IP, user agent, timestamps) in its server logs for operational purposes. See vercel.com/legal/privacy-policy.

## 6. Your rights

You can:

- Request access to the data we store about you
- Request deletion of your account and all associated data
- Request deletion of feedback submissions you have authored, if they can be identified (provide the submission ID or contact email used)
- Withdraw your consent at any time by deleting your account

To exercise these rights, contact us at [contact@founderbacon.com](mailto:contact@founderbacon.com).

## 7. Cookies and local storage

**Cookies:** we use a minimal authentication cookie (JWT session token) only when you are logged in. We do not use tracking cookies, analytics cookies, or third-party advertising cookies.

**Browser local storage:** we use your browser's local storage for non-tracking, client-side state only, including:

- Your saved hero loadout (commander, support, team perks, F.O.R.T. offensive).
- UI preferences such as the dismissed state of the staging environment banner.

This local storage data never leaves your device and is not transmitted to our servers.

## 8. External links and third-party services

Our website includes links to third-party platforms (Discord, X/Twitter, GitHub, Epic Games). When you follow these links, the third party's privacy policy applies. We are not responsible for the content or privacy practices of external sites.

## 9. Children's privacy

Our services are not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, please contact us immediately.

## 10. Changes to this policy

We may update this Privacy Policy from time to time. We will notify users of significant changes by posting a notice on our website. Your continued use of our services after changes constitutes acceptance of the updated policy.

## 11. Contact us

If you have questions about this Privacy Policy, contact us at [contact@founderbacon.com](mailto:contact@founderbacon.com).
