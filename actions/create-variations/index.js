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

// main function that will be executed by Adobe I/O Runtime
async function main (params) {
  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {
    // 'info' is the default level if not set
    logger.info('Calling the main action')

    // log parameters, only if params.LOG_LEVEL === 'debug'
    logger.debug(stringParameters(params))

    // check for missing request input parameters and headers
    const requiredParams = ['aemHost', 'selectedAudiences', 'modelPath', 'fragmentPath'];
    const requiredHeaders = ['Authorization']
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
    if (errorMessage) {
      // return and log client errors
      return errorResponse(400, errorMessage, logger)
    }

    const {aemHost, selectedAudiences, modelPath, fragmentPath} = params;
    
    // {
    //   aemHost: `https://${guestConnection.sharedContext.get('aemHost')}`,
    //   selectedAudiences: selectedAudiences,
    //   modelPath: model.path,
    //   fragmentPath: path.replace('/content/dam', '/api/assets')
    // };

    // extract the user Bearer token from the Authorization header
    const token = getBearerToken(params)

    // // replace this with the api you want to access
    const apiEndpoint = `${aemHost}${fragmentPath}`;

    // // fetch content from external api endpoint
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
        const name = a.toLowerCase().replace(' ', '-');
        elements.properties.elements[item].variations[name] = {
          title: a,
          value: elements.properties.elements[item].title
        };
        elements.properties.elements[item].variationsOrder.push(name);
      })
    });

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

function addVariations(variations, element) {
  const {title, value} = element.variations;
  element.variations['audience-1'].title = title;
  element.variations['audience-1'].value = value;
}

exports.main = main

// {
//   "properties": {
//     "title": "foobar",
//     "description": "foobar",
//     "elements": {
//       "title": {
//         "value": "The HTML content of the element.",
//         ":type": "string",
//         "variations": {
//           "example2": {
//             "value": "The HTML content of the element.",
//             ":type": "string"
//           }
//         }
//       }
//     }
//   }
// }

// https://author-p124903-e1228403.adobeaemcloud.com/api/assets/wknd-headless/site/en/home/components/hero