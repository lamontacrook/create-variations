const fetch = require('node-fetch')
const { Core } = require('@adobe/aio-sdk')
const { errorResponse, getBearerToken, stringParameters, checkMissingRequestInputs } = require('../utils')

async function main (params) {
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {
    logger.info('Calling the main action')
    logger.debug(stringParameters(params))

    const requiredParams = ['aemHost', 'selectedAudiences', 'modelPath', 'fragmentPath'];
    const requiredHeaders = ['Authorization']
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
    if (errorMessage) {
      return errorResponse(400, errorMessage, logger)
    }

    const {aemHost, selectedAudiences, modelPath, fragmentPath} = params;
    const token = getBearerToken(params)
    const apiEndpoint = `${aemHost}${fragmentPath}`;

    const res = await fetch(`${apiEndpoint}.json`, {
      method: 'get',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error('request to ' + apiEndpoint + ' failed with status code ' + res.status)
    }
    const content = await res.json();
    const elements = {
      "properties": {
        "elements": content?.properties?.elements
      }
    };

    Object.keys(elements.properties.elements).forEach((item) => {
      selectedAudiences.forEach((a) => {
        const name = a.toLowerCase().replaceAll(' ', '-');
        elements.properties.elements[item].variations[name] = {
          title: a,
          value: elements.properties.elements[item].value
        };
        elements.properties.elements[item].variationsOrder.push(name);
      })
    });

    logger.info('-----');
    logger.info(JSON.stringify(elements));
    logger.info('-----');

    const update = await fetch(apiEndpoint, {
      method: 'put',
      body: JSON.stringify(elements),
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const response = {
      statusCode: 200,
      body: update
    }

    // log the response status code
    logger.info(`${response.statusCode}: successful request`)
    return response
  } catch (error) {
    // log any server errors
    logger.error(error)
    // return with 500
    return errorResponse(500, 'server error', logger)
  }
}

exports.main = main