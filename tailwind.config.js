module.exports = {
  content: [
    "./public/**/*.{html,js}",  // Ajusta la ruta para incluir los archivos en la carpeta 'public'
  ],
  theme: {
    extend: {},
  },
  plugins: [

    require('tailwindcss-animate')

  ],
}
