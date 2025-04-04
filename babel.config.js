export default {
  presets: [
    ['@babel/preset-env', {
      targets: { 
        node: 'current',
        browsers: ['last 2 versions']
      },
      modules: 'auto'
    }],
    ['@babel/preset-react', { 
      runtime: 'automatic'
    }],
    '@babel/preset-typescript'
  ],
  plugins: [
    '@babel/plugin-transform-runtime',
    '@babel/plugin-proposal-class-properties'
  ]
}; 