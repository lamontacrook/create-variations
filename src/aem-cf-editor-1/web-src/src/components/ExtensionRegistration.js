/*
 * <license header>
 */

import { Text } from '@adobe/react-spectrum';
import { generatePath } from 'react-router';
import { register } from '@adobe/uix-guest';
import { extensionId } from './Constants';

const disAllowedModels = [
  'adventure',
  'configuration'
];

async function ExtensionRegistration() {
  const guestConnection = await register({
    id: extensionId,
    methods: {
      headerMenu: {
        async getButtons() {
          const contentFragment = await guestConnection.host.contentFragment.getContentFragment();
          const model = contentFragment.model;
          return [
            {
              id: 'create-variations-from-audiences',
              label: 'Create Variations from Audiences',
              icon: 'OpenIn',
              variant: 'action',
              disabled: 'yes',
              onClick() {
                
                const modalURL =
                  '/index.html#' +
                  generatePath(
                    '/content-fragment/:fragment/create-variations-from-audiences-modal',
                    {
                      fragment: encodeURIComponent(contentFragment.path),
                    }
                  );

                guestConnection.host.modal.showUrl({
                  title: 'Create Variations from Audiences',
                  url: modalURL,
                  loading: true,
                  height:'70vh'
                });
              },
            },
          ];
        },
      },
    }
  });

  const init = async () => {
    guestConnection;
  };

  init().catch(console.error);

  return <Text>IFrame for integration with Host (AEM)...</Text>;
}

export default ExtensionRegistration;
