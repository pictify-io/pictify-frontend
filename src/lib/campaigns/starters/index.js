/**
 * Starter designs. FE-8.
 *
 * These used to be "presets" — a product surface with its own picker. The
 * studio handoff removed that: every campaign now uses a design made in the
 * shared studio, and these two survive only as STARTING POINTS and as fidelity
 * fixtures for the B00/B05 render tests.
 *
 * So there is no preset registry, no preset version negotiation and no UI that
 * calls them presets. They are HTML a new design begins from.
 */

export const VALUE_CARD_PNG = `<div style="width:1200px;height:800px;padding:80px;box-sizing:border-box;font-family:Inter,-apple-system,sans-serif;background:#FFFFFF;display:flex;flex-direction:column;justify-content:space-between">
  <div style="display:flex;align-items:center;justify-content:space-between">
    <div style="font-size:20px;font-weight:700;color:#000">{{brand_name}}</div>
    <div style="font-size:16px;color:#8A8A85">{{period}}</div>
  </div>
  <div>
    <div style="font-size:18px;color:#8A8A85">Your month with {{brand_name}}</div>
    <div style="font-size:52px;font-weight:800;margin-top:8px;color:#000">{{account_name}}</div>
    <div style="display:flex;gap:80px;margin-top:56px">
      <div>
        <div style="font-size:88px;font-weight:800;line-height:1;color:#000">{{metric_1}}</div>
        <div style="font-size:18px;color:#383A42;margin-top:12px">{{metric_1_label}}</div>
      </div>
      <div>
        <div style="font-size:88px;font-weight:800;line-height:1;color:#000">{{metric_2}}</div>
        <div style="font-size:18px;color:#383A42;margin-top:12px">{{metric_2_label}}</div>
      </div>
    </div>
  </div>
  <div style="font-size:16px;color:#8A8A85">Thank you for building with {{brand_name}}.</div>
</div>`;

export const VALUE_SUMMARY_PDF = `<div style="width:794px;min-height:1123px;padding:64px;box-sizing:border-box;font-family:Inter,-apple-system,sans-serif;background:#FFFFFF">
  <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #000;padding-bottom:20px">
    <div style="font-size:22px;font-weight:800;color:#000">{{brand_name}}</div>
    <div style="font-size:14px;color:#8A8A85">{{period}}</div>
  </div>
  <div style="font-size:40px;font-weight:800;margin-top:44px;color:#000">{{account_name}}</div>
  <div style="font-size:16px;color:#383A42;margin-top:8px">Value summary for the period above.</div>
  <div style="display:flex;gap:56px;margin-top:52px">
    <div>
      <div style="font-size:64px;font-weight:800;line-height:1;color:#000">{{metric_1}}</div>
      <div style="font-size:15px;color:#383A42;margin-top:10px">{{metric_1_label}}</div>
    </div>
    <div>
      <div style="font-size:64px;font-weight:800;line-height:1;color:#000">{{metric_2}}</div>
      <div style="font-size:15px;color:#383A42;margin-top:10px">{{metric_2_label}}</div>
    </div>
  </div>
  <div style="margin-top:56px;padding:20px;background:#F4F6F4;font-size:14px;color:#383A42;line-height:1.55">
    <strong>How these figures were produced.</strong> {{method_note}}
  </div>
</div>`;

export const STARTERS = [
	{
		key: 'value-card-png',
		name: 'Value card',
		format: 'png',
		width: 1200,
		height: 800,
		summary: 'A card sized for the body of an email.',
		html: VALUE_CARD_PNG
	},
	{
		key: 'value-summary-pdf',
		name: 'Value summary',
		format: 'pdf',
		width: 794,
		height: 1123,
		summary: 'A one-page summary to attach or share.',
		html: VALUE_SUMMARY_PDF
	}
];

/** The values the studio and CardPreview substitute when showing a sample. */
export const SAMPLE_VALUES = {
	brand_name: 'Northwind',
	period: 'September 1 – 30, 2026',
	account_name: 'Contoso Freight',
	metric_1: '1,284',
	metric_1_label: 'workflows completed',
	metric_2: '312.4',
	metric_2_label: 'hours saved (estimated)',
	method_note: 'Modelled from average handling time before and after automation.'
};
