export const StyleSchema = () => ({
  title: 'Styling',
  fieldsets: [
    {
      id: 'default',
      title: 'Style',
      fields: ['title_size', 'arrow_select'],
    },
  ],
  properties: {
    title_size: {
      title: 'Title size',
      description: 'Size of accordion Title in a Panel',
      choices: [
        ['xx-small', 'xx-small'],
        ['x-small', 'x-small'],
        ['small', 'small'],
        ['medium', 'medium'],
        ['large', 'large'],
        ['x-large', 'x-large'],
        ['xx-large', 'xx-large'],
        ['xxx-large', 'xxx-large'],
      ],
    },
    arrow_select: {
      title: 'Toggle arrows',
      type: 'boolean',
      default: false,
    },
  },
  required: [],
});
