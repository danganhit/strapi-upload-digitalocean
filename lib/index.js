'use strict';

/**
 * Module dependencies
 */

/* eslint-disable import/no-unresolved */
/* eslint-disable no-unused-vars */
// Public node modules.
const _ = require('lodash');
const AWS = require('aws-sdk');

module.exports = {
  provider: 'digitalocean',
  name: 'Digital Ocean Space Upload',
  auth: {
    public: {
      label: 'Access API Token',
      type: 'text'
    },
    private: {
      label: 'Secret Access Token',
      type: 'text'
    },
    region: {
      label: 'Region',
      type: 'enum',
      values: [
        'nyc3',
        'sgp1'
      ]
    },
    bucket: {
      label: 'Bucket',
      type: 'text'
    },
    rootPath:{
      label:"rootPath",
      type:'text',
      values:"/strapi"
    }
  },
  init: (config) => {
    // configure AWS S3 bucket connection
    const spacesEndpoint = new AWS.Endpoint(`${config.region}.digitaloceanspaces.com`);
    AWS.config.update({
      endpoint: spacesEndpoint,
      accessKeyId: config.public,
      secretAccessKey: config.private,
      region: config.region,
      rootPath: config.region
    });

    const S3 = new AWS.S3({
      apiVersion: 'latest',
      params: {
        Bucket: config.bucket
      }
    });

    return {
      upload: (file) => {
        return new Promise((resolve, reject) => {
          // upload file on S3 bucket
          const path = config.rootPath+file.path ? `${file.path}/` : '';
          S3.upload({
            Key: `${path}${file.hash}${file.ext}`,
            Body: new Buffer(file.buffer, 'binary'),
            ACL: 'public-read',
            ContentType: file.mime,
          }, (err, data) => {
            if (err) {
              return reject(err);
            }
            // set the bucket file url
            file.url = data.Location;
            resolve();
          });
        });
      },
      delete: (file) => {
        return new Promise((resolve, reject) => {
          // delete file on S3 bucket
          const path = config.rootPath+file.path ? `${file.path}/` : '';
          S3.deleteObject({
            Key: `${path}${file.hash}${file.ext}`
          }, (err, data) => {
            if (err) {
              return reject(err);
            }

            resolve();
          });
        });
      }
    };
  }
};
