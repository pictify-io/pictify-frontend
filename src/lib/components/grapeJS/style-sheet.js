const popularFontsLinks = [
	'https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700;900&display=swap',
	'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700;800&display=swap',
	'https://fonts.googleapis.com/css2?family=Montserrat:wght@100;200;300;400;500;600;700;800;900&display=swap',
	'https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600;700;800;900&display=swap',
	'https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@300;400;700&display=swap',
	'https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@200;300;400;600;700;900&display=swap',
	'https://fonts.googleapis.com/css2?family=Oswald:wght@200;300;400;500;600;700&display=swap',
	'https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&family=Manrope:wght@400;600;700;800&family=Silkscreen&display=swap',
	'https://fonts.googleapis.com/css2?family=DynaPuff:wght@400..700&display=swap'
];

const popularFonts = [
	{ id: 'Roboto', name: 'Roboto', className: 'roboto' },
	{ id: 'Roboto Condensed', name: 'Roboto Condensed', className: 'roboto-condensed' },
	{ id: 'Open Sans', name: 'Open Sans', className: 'open-sans' },
	{ id: 'Montserrat', name: 'Montserrat', className: 'montserrat' },
	{ id: 'Poppins', name: 'Poppins', className: 'poppins' },
	{ id: 'Source Sans Pro', name: 'Source Sans Pro', className: 'source-sans-pro' },
	{ id: 'Oswald', name: 'Oswald', className: 'oswald' },
	{ id: 'Inter', name: 'Inter', className: 'inter' },
	{ id: 'Manrope', name: 'Manrope', className: 'manrope' },
	{ id: 'DynaPuff', name: 'DynaPuff', className: 'dynapuff' }
];

const addFonts = (editor) => {
	const styleManager = editor.StyleManager;
	const fontFamilyProperty = styleManager.getProperty('typography', 'font-family');
	let fonts = fontFamilyProperty.get('options');
	fonts = fonts.concat(popularFonts);
	fontFamilyProperty.set('options', fonts);
};

export { addFonts, popularFontsLinks };
