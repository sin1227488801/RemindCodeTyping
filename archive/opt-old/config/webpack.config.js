const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const isDevelopment = !isProduction;

  return {
    mode: isProduction ? 'production' : 'development',
    
    entry: {
      // Main application entry points
      main: './Rct/js/main.js',
      auth: './Rct/js/auth.js',
      
      // Lazy-loaded modules
      typing: {
        import: './Rct/js/modules/typing.js',
        dependOn: 'shared'
      },
      studybook: {
        import: './Rct/js/modules/studybook.js',
        dependOn: 'shared'
      },
      records: {
        import: './Rct/js/modules/records.js',
        dependOn: 'shared'
      },
      
      // Shared dependencies
      shared: [
        './Rct/js/infrastructure/http/ApiClient.js',
        './Rct/js/infrastructure/errors/ErrorHandlerService.js',
        './Rct/js/infrastructure/logging/Logger.js'
      ]
    },

    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction 
        ? 'js/[name].[contenthash:8].js' 
        : 'js/[name].js',
      chunkFilename: isProduction 
        ? 'js/[name].[contenthash:8].chunk.js' 
        : 'js/[name].chunk.js',
      clean: true,
      publicPath: '/'
    },

    resolve: {
      extensions: ['.js', '.json'],
      alias: {
        '@': path.resolve(__dirname, 'Rct/js'),
        '@domain': path.resolve(__dirname, 'Rct/js/domain'),
        '@application': path.resolve(__dirname, 'Rct/js/application'),
        '@infrastructure': path.resolve(__dirname, 'Rct/js/infrastructure'),
        '@presentation': path.resolve(__dirname, 'Rct/js/presentation')
      }
    },

    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  targets: {
                    browsers: ['> 1%', 'last 2 versions']
                  },
                  modules: false,
                  useBuiltIns: 'usage',
                  corejs: 3
                }]
              ],
              plugins: [
                '@babel/plugin-syntax-dynamic-import',
                '@babel/plugin-proposal-class-properties'
              ]
            }
          }
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
                sourceMap: isDevelopment
              }
            },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [
                    ['autoprefixer'],
                    ...(isProduction ? [['cssnano']] : [])
                  ]
                }
              }
            }
          ]
        },
        {
          test: /\.(png|jpg|jpeg|gif|svg)$/,
          type: 'asset/resource',
          generator: {
            filename: 'images/[name].[contenthash:8][ext]'
          }
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/,
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[name].[contenthash:8][ext]'
          }
        }
      ]
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: './Rct/main.html',
        filename: 'main.html',
        chunks: ['shared', 'main'],
        minify: isProduction ? {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true
        } : false
      }),

      new HtmlWebpackPlugin({
        template: './Rct/login-new.html',
        filename: 'login.html',
        chunks: ['shared', 'auth'],
        minify: isProduction
      }),

      ...(isProduction ? [
        new MiniCssExtractPlugin({
          filename: 'css/[name].[contenthash:8].css',
          chunkFilename: 'css/[name].[contenthash:8].chunk.css'
        })
      ] : []),

      ...(env.analyze ? [
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: 'bundle-analysis.html'
        })
      ] : [])
    ],

    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: isProduction,
              drop_debugger: isProduction
            },
            format: {
              comments: false
            }
          },
          extractComments: false
        }),
        new CssMinimizerPlugin()
      ],

      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          // Vendor libraries
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 20
          },
          
          // Common application code
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true
          },
          
          // Infrastructure layer
          infrastructure: {
            test: /[\\/]infrastructure[\\/]/,
            name: 'infrastructure',
            chunks: 'all',
            priority: 15
          },
          
          // Domain layer
          domain: {
            test: /[\\/]domain[\\/]/,
            name: 'domain',
            chunks: 'all',
            priority: 15
          }
        }
      },

      runtimeChunk: {
        name: 'runtime'
      }
    },

    devtool: isDevelopment ? 'eval-source-map' : 'source-map',

    devServer: {
      static: {
        directory: path.join(__dirname, 'Rct')
      },
      compress: true,
      port: 3000,
      hot: true,
      open: true,
      historyApiFallback: {
        rewrites: [
          { from: /^\/main/, to: '/main.html' },
          { from: /^\/login/, to: '/login.html' }
        ]
      },
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          secure: false
        }
      }
    },

    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 250000,
      maxAssetSize: 250000
    },

    stats: {
      colors: true,
      modules: false,
      children: false,
      chunks: false,
      chunkModules: false
    }
  };
};