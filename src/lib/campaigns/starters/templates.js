/**
 * Starter templates for the studio's Start state. PS-6 (board PS-04 `K7R-0`).
 *
 * Three, because they are the three shapes the product is actually asked for:
 * an OG image, a certificate, an invoice. Each one is a WHOLE DOCUMENT with an
 * `<html>` and a `<body>` that carry the canvas size, because that is what a
 * real template looks like and starting from a bare fragment teaches the wrong
 * shape.
 *
 * They live beside the campaign starters and follow the same convention: HTML
 * in a template literal in a JS module, not a `.html` file. The build has no
 * raw-html import configured, and one starter loaded differently from the
 * others is a difference someone has to discover.
 *
 * Every dynamic value is a `{{token}}` rather than a helper call, so the
 * variables a starter declares are the ones the Inputs rail will list.
 */

export const OG_IMAGE = `<html style="margin:0;padding:0">
<head>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;width:1200px;height:630px;box-sizing:border-box;font-family:'Inter',system-ui,sans-serif;background:#FFFFFF;display:flex;flex-direction:column;justify-content:space-between;padding:64px">
  <div style="display:flex;align-items:center;justify-content:space-between">
    <div style="font-size:19px;font-weight:700;color:#111111">{{site_name}}</div>
    <div style="font-size:13px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;color:#6B7280">{{category}}</div>
  </div>
  <div>
    <div style="width:64px;height:6px;background:#1B3A6B"></div>
    <div style="font-size:62px;font-weight:800;line-height:1.08;letter-spacing:-0.02em;color:#111111;margin-top:28px">{{title}}</div>
  </div>
  <div style="display:flex;align-items:center;gap:14px;font-size:16px;color:#4B5563">
    <span style="font-weight:500;color:#111111">{{author}}</span>
    <span style="color:#D1D5DB">·</span>
    <span>{{published_on}}</span>
    <span style="color:#D1D5DB">·</span>
    <span>{{read_time}}</span>
  </div>
</body>
</html>`;

export const CERTIFICATE = `<html style="margin:0;padding:0">
<head>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;width:1123px;height:794px;box-sizing:border-box;font-family:'Inter',system-ui,sans-serif;background:#FBFAF7;display:flex;align-items:center;justify-content:center">
  <div style="width:1003px;height:674px;box-sizing:border-box;border:1px solid #C9BFA8;padding:64px;display:flex;flex-direction:column;align-items:center;text-align:center;justify-content:space-between;background:#FFFFFF">
    <div>
      <div style="font-size:12px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:#8A7F66">{{issuer}}</div>
      <div style="font-family:'Playfair Display',Georgia,serif;font-size:38px;font-weight:700;color:#1A1A1A;margin-top:18px">Certificate of Completion</div>
    </div>
    <div>
      <div style="font-size:15px;color:#6B6355">This certifies that</div>
      <div style="font-family:'Playfair Display',Georgia,serif;font-size:52px;font-weight:600;color:#1A1A1A;margin-top:10px">{{recipient_name}}</div>
      <div style="width:280px;height:1px;background:#C9BFA8;margin:20px auto 0"></div>
      <div style="font-size:17px;line-height:1.6;color:#4A4438;margin-top:20px;max-width:640px">has successfully completed <strong style="color:#1A1A1A">{{course_name}}</strong></div>
    </div>
    <div style="display:flex;align-items:flex-end;justify-content:space-between;width:100%;font-size:13px;color:#6B6355">
      <div style="text-align:left">
        <div style="border-top:1px solid #C9BFA8;padding-top:8px;min-width:200px">{{completed_on}}</div>
        <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;margin-top:4px;color:#8A7F66">Date</div>
      </div>
      <div style="text-align:right">
        <div style="border-top:1px solid #C9BFA8;padding-top:8px;min-width:200px">{{signatory}}</div>
        <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;margin-top:4px;color:#8A7F66">Signed</div>
      </div>
    </div>
  </div>
</body>
</html>`;

export const INVOICE = `<html style="margin:0;padding:0">
<head>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;width:794px;min-height:1123px;box-sizing:border-box;font-family:'Inter',system-ui,sans-serif;background:#FFFFFF;padding:56px;color:#111111">
  <div style="display:flex;align-items:flex-start;justify-content:space-between;border-bottom:2px solid #111111;padding-bottom:20px">
    <div>
      <div style="font-size:22px;font-weight:700">{{company_name}}</div>
      <div style="font-size:13px;color:#6B7280;margin-top:4px">{{company_address}}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#6B7280">Invoice</div>
      <div style="font-size:20px;font-weight:700;margin-top:4px">{{invoice_number}}</div>
    </div>
  </div>

  <div style="display:flex;justify-content:space-between;margin-top:32px;font-size:13px">
    <div>
      <div style="font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#6B7280">Billed to</div>
      <div style="font-size:15px;font-weight:600;margin-top:6px">{{client_name}}</div>
      <div style="color:#4B5563;margin-top:2px">{{client_email}}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#6B7280">Issued · Due</div>
      <div style="margin-top:6px">{{issued_on}}</div>
      <div style="color:#4B5563;margin-top:2px">{{due_on}}</div>
    </div>
  </div>

  <div style="margin-top:36px">
    <div style="display:flex;justify-content:space-between;border-bottom:1px solid #E5E7EB;padding-bottom:8px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#6B7280">
      <span>Description</span><span>Amount</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:16px 0;border-bottom:1px solid #F3F4F6;font-size:14px">
      <span>{{line_item_1}}</span><span style="font-variant-numeric:tabular-nums">{{line_amount_1}}</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:16px 0;border-bottom:1px solid #F3F4F6;font-size:14px">
      <span>{{line_item_2}}</span><span style="font-variant-numeric:tabular-nums">{{line_amount_2}}</span>
    </div>
  </div>

  <div style="display:flex;justify-content:flex-end;margin-top:24px">
    <div style="min-width:260px">
      <div style="display:flex;justify-content:space-between;font-size:14px;color:#4B5563">
        <span>Subtotal</span><span style="font-variant-numeric:tabular-nums">{{subtotal}}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:14px;color:#4B5563;margin-top:8px">
        <span>Tax</span><span style="font-variant-numeric:tabular-nums">{{tax}}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:19px;font-weight:700;border-top:2px solid #111111;margin-top:12px;padding-top:12px">
        <span>Total</span><span style="font-variant-numeric:tabular-nums">{{total}}</span>
      </div>
    </div>
  </div>

  <div style="font-size:12px;color:#6B7280;margin-top:48px;border-top:1px solid #E5E7EB;padding-top:16px">{{payment_terms}}</div>
</body>
</html>`;

/**
 * The picker rows, in board order.
 *
 * `prompt` is what a starter puts in the description box — a starter FILLS the
 * box, it does not generate. `html` is what "use it as-is" mounts.
 */
export const TEMPLATE_STARTERS = [
	{
		key: 'og-image',
		label: 'OG image · 1200 × 630',
		format: 'png',
		width: 1200,
		height: 630,
		html: OG_IMAGE,
		prompt:
			'An OG image for blog posts. Site name and category up top, the post title big, author, date and read time below. Our blue accent bar.'
	},
	{
		key: 'certificate',
		label: 'Certificate · landscape A4',
		format: 'pdf',
		width: 1123,
		height: 794,
		html: CERTIFICATE,
		prompt:
			'A certificate of completion in landscape A4. The issuer up top, the recipient’s name large and centred, the course below it, and the date and signatory along the bottom.'
	},
	{
		key: 'invoice',
		label: 'Invoice · PDF',
		format: 'pdf',
		width: 794,
		height: 1123,
		html: INVOICE,
		prompt:
			'A one-page invoice. Company and invoice number up top, who it is billed to, a table of line items with amounts, and a total block with subtotal, tax and total.'
	}
];
