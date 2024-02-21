/*
* <license header>
*/

/**
 * This is a sample action showcasing how to access an external API
 *
 * Note:
 * You might want to disable authentication and authorization checks against Adobe Identity Management System for a generic action. In that case:
 *   - Remove the require-adobe-auth annotation for this action in the manifest.yml of your application
 *   - Remove the Authorization header from the array passed in checkMissingRequestInputs
 *   - The two steps above imply that every client knowing the URL to this deployed action will be able to invoke it without any authentication and authorization checks against Adobe Identity Management System
 *   - Make sure to validate these changes against your security requirements before deploying the action
 */


const fetch = require('node-fetch')
const { Core } = require('@adobe/aio-sdk')
const { errorResponse, getBearerToken, stringParameters, checkMissingRequestInputs } = require('../utils')

async function main(params) {
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {
    logger.info('Calling the main action');
    logger.debug(stringParameters(params));

    const requiredParams = ['aemHost', 'config', 'fragment'];
    const requiredHeaders = ['Authorization'];
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders);

    if (errorMessage) return errorResponse(400, 'oops ' + errorMessage, logger);

    const { aemHost, config, fragment } = params;
    const token = getBearerToken(params);
    const apiEndpoint = `${aemHost}/graphql/execute.json/aem-demo-assets/${fragment};path=${config}`;

    const res = await fetch(apiEndpoint, {
      method: 'get',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error('request to ' + apiEndpoint + ' failed with status code ' + res.status)
    }

    let content = await res.json();
    const { targetApiKey, targetTenet } = content.data.configurationByPath.item;

    if (targetApiKey && targetTenet) {
      const targetApi = `https://mc.adobe.io/${targetTenet}/target/audiences/`;
      const t = await fetch(targetApi, {
        method: 'get',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.adobe.target.v3+json',
          'x-api-key': targetApiKey
        }
      });
      content = await t.json();

      const aud = content.audiences.reduce((accumulator, item, index) => {
        if (item.name) { accumulator[index] = item.name }
        return accumulator;
      });

      const elements = {
        "properties": {
          "elements": {
            "audiences": {
              "value": Object.values(aud)
            }
          }
        }
      };

      const configuration = `${aemHost}${config.replace('/content/dam', '/api/assets')}`
      const updateConfig = await fetch(configuration, {
        method: 'put',
        body: JSON.stringify(elements),
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      logger.debug(updateConfig);
    }

    const response = {
      statusCode: 200,
      body: content
    };

    logger.info(`${response.statusCode}: successful request`)
    return response
  } catch (error) {
    logger.error(error)
    return errorResponse(500, 'server error', logger)
  }
}

exports.main = main