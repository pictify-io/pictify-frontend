<script>
	import { editor } from '../../../store/editor.store';
	import { 
		createQRCode, 
		formatQRData, 
		QR_CONTENT_TYPES
	} from '../../utils/fabric-qr';
	
	// QR code configuration state
	let selectedContentType = 'url';
	let qrContent = '';
	
	// WiFi-specific fields
	let wifiSSID = '';
	let wifiPassword = '';
	let wifiEncryption = 'WPA';
	let wifiHidden = false;
	
	// Email-specific fields
	let emailAddress = '';
	let emailSubject = '';
	let emailBody = '';
	
	// SMS-specific fields
	let smsPhone = '';
	let smsBody = '';
	
	function getContentPlaceholder() {
		const type = QR_CONTENT_TYPES.find(t => t.type === selectedContentType);
		return type?.placeholder || 'Enter content...';
	}
	
	function getFormattedData() {
		switch (selectedContentType) {
			case 'url':
			case 'text':
			case 'phone':
				return formatQRData(selectedContentType, qrContent);
			case 'email':
				return formatQRData('email', {
					email: emailAddress || qrContent,
					subject: emailSubject,
					body: emailBody
				});
			case 'sms':
				return formatQRData('sms', {
					phone: smsPhone || qrContent,
					body: smsBody
				});
			case 'wifi':
				return formatQRData('wifi', {
					ssid: wifiSSID,
					password: wifiPassword,
					encryption: wifiEncryption,
					hidden: wifiHidden
				});
			default:
				return qrContent;
		}
	}
	
	async function addQRCode() {
		if (!$editor) return;

		const data = getFormattedData();
		if (!data || data.trim() === '') {
			alert('Please enter content for the QR code');
			return;
		}

		const center = $editor.getCenter();

		try {
			// Create with default styling - user can customize in Properties Panel
			const qr = await createQRCode({
				data,
				width: 200,
				height: 200,
				fgColor: '#000000',
				bgColor: '#ffffff',
				errorCorrectionLevel: 'M',
				patternStyle: 'squares',
				cornerStyle: 'squares',
				contentType: selectedContentType
			});

			qr.set({
				left: center.left,
				top: center.top
			});

			$editor.add(qr);
			$editor.setActiveObject(qr);
			$editor.renderAll();

			// Reset form
			resetForm();
		} catch (error) {
			console.error('Error creating QR code:', error);
			alert('Failed to create QR code. Please try again.');
		}
	}
	
	function addQuickQR(type) {
		selectedContentType = type;
		const placeholders = {
			'url': 'https://example.com',
			'text': 'Hello World',
			'email': 'hello@example.com',
			'phone': '+1234567890',
			'sms': '+1234567890',
			'wifi': 'MyNetwork'
		};
		
		if (type === 'wifi') {
			wifiSSID = placeholders.wifi;
			wifiPassword = 'password123';
		} else if (type === 'email') {
			emailAddress = placeholders.email;
		} else if (type === 'sms') {
			smsPhone = placeholders.sms;
		} else {
			qrContent = placeholders[type] || '';
		}
		
		addQRCode();
	}
	
	function resetForm() {
		qrContent = '';
		wifiSSID = '';
		wifiPassword = '';
		emailAddress = '';
		emailSubject = '';
		emailBody = '';
		smsPhone = '';
		smsBody = '';
	}
	
	function handleContentTypeChange() {
		resetForm();
	}
</script>

<div class="qr-library">
	<!-- Quick Add Section -->
	<div class="section">
		<h3 class="section-title">Quick Add</h3>
		<div class="quick-grid">
			{#each QR_CONTENT_TYPES as type}
				<button 
					class="quick-item"
					on:click={() => addQuickQR(type.type)}
					title="Add {type.label} QR Code"
				>
					<i class="fa {type.icon} icon"></i>
					<span class="label">{type.label}</span>
				</button>
			{/each}
		</div>
		<p class="hint-text">
			<i class="fa fa-info-circle"></i> 
			Select a QR code to customize its design in the Properties panel
		</p>
	</div>
	
	<!-- Custom QR Code Section -->
	<div class="section">
		<h3 class="section-title">Custom Content</h3>
		
		<!-- Content Type Selector -->
		<div class="input-group">
			<label for="content-type">Type</label>
			<select 
				id="content-type" 
				bind:value={selectedContentType}
				on:change={handleContentTypeChange}
			>
				{#each QR_CONTENT_TYPES as type}
					<option value={type.type}>{type.label}</option>
				{/each}
			</select>
		</div>
		
		<!-- Dynamic Content Input -->
		{#if selectedContentType === 'wifi'}
			<div class="input-group">
				<label for="wifi-ssid">Network Name</label>
				<input 
					id="wifi-ssid"
					type="text" 
					bind:value={wifiSSID}
					placeholder="MyNetwork"
				/>
			</div>
			<div class="input-group">
				<label for="wifi-password">Password</label>
				<input 
					id="wifi-password"
					type="text" 
					bind:value={wifiPassword}
					placeholder="password"
				/>
			</div>
			<div class="input-group">
				<label for="wifi-encryption">Security</label>
				<select id="wifi-encryption" bind:value={wifiEncryption}>
					<option value="WPA">WPA/WPA2</option>
					<option value="WEP">WEP</option>
					<option value="nopass">None</option>
				</select>
			</div>
		{:else if selectedContentType === 'email'}
			<div class="input-group">
				<label for="email-address">Email</label>
				<input 
					id="email-address"
					type="email" 
					bind:value={emailAddress}
					placeholder="hello@example.com"
				/>
			</div>
			<div class="input-group">
				<label for="email-subject">Subject</label>
				<input 
					id="email-subject"
					type="text" 
					bind:value={emailSubject}
					placeholder="Optional"
				/>
			</div>
		{:else if selectedContentType === 'sms'}
			<div class="input-group">
				<label for="sms-phone">Phone</label>
				<input 
					id="sms-phone"
					type="tel" 
					bind:value={smsPhone}
					placeholder="+1234567890"
				/>
			</div>
			<div class="input-group">
				<label for="sms-body">Message</label>
				<input 
					id="sms-body"
					type="text"
					bind:value={smsBody}
					placeholder="Optional"
				/>
			</div>
		{:else}
			<div class="input-group">
				<label for="qr-content">{selectedContentType === 'url' ? 'URL' : 'Text'}</label>
				<input 
					id="qr-content"
					type="text" 
					bind:value={qrContent}
					placeholder={getContentPlaceholder()}
				/>
			</div>
		{/if}
		
		<!-- Add Button -->
		<button class="add-btn" on:click={addQRCode}>
			<i class="fa fa-plus"></i>
			Add QR Code
		</button>
	</div>
</div>

<style>
	.qr-library {
		padding: 8px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	
	.section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	
	.section-title {
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #111827;
		margin: 0;
		border-bottom: 2px solid #111827;
		padding-bottom: 4px;
	}
	
	.hint-text {
		font-size: 10px;
		color: #6b7280;
		margin: 4px 0 0 0;
		display: flex;
		align-items: center;
		gap: 4px;
	}
	
	.quick-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 6px;
	}
	
	.quick-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		padding: 10px 6px;
		background: #fff;
		border: 2px solid #111827;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.1s ease;
		box-shadow: 2px 2px 0 0 #111827;
	}
	
	.quick-item:hover {
		transform: translate(-1px, -1px);
		box-shadow: 3px 3px 0 0 #ffc480;
	}
	
	.quick-item .icon {
		font-size: 16px;
		color: #111827;
	}
	
	.quick-item .label {
		font-size: 9px;
		font-weight: 700;
		color: #111827;
		text-align: center;
		text-transform: uppercase;
	}
	
	.input-group {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}
	
	.input-group label {
		font-size: 10px;
		font-weight: 700;
		color: #111827;
		text-transform: uppercase;
	}
	
	.input-group input,
	.input-group select {
		padding: 6px 8px;
		border: 2px solid #111827;
		border-radius: 4px;
		font-size: 12px;
		background: #fff;
		box-shadow: 2px 2px 0 0 #111827;
	}
	
	.input-group input:focus,
	.input-group select:focus {
		outline: none;
		box-shadow: 2px 2px 0 0 #ffc480;
	}
	
	.add-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		width: 100%;
		padding: 10px 12px;
		background: #111827;
		border: 2px solid #111827;
		border-radius: 6px;
		color: #fff;
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		cursor: pointer;
		transition: all 0.1s ease;
		box-shadow: 2px 2px 0 0 #ffc480;
	}
	
	.add-btn:hover {
		transform: translate(-1px, -1px);
		box-shadow: 3px 3px 0 0 #ffc480;
	}
</style>
