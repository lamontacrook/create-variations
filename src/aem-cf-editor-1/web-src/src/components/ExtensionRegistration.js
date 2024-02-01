/*
 * <license header>
 */

import { Text } from "@adobe/react-spectrum";
import { generatePath } from "react-router";
import { register } from "@adobe/uix-guest";
import { extensionId } from "./Constants";

function ExtensionRegistration() {
  const init = async () => {
    const guestConnection = await register({
      id: extensionId,
      methods: {
        headerMenu: {
          getButtons() {
            return [
              // @todo YOUR HEADER BUTTONS DECLARATION SHOULD BE HERE
              {
                id: 'create-variations-from-audiences',
                label: 'Create Variations from Audiences v3',
                icon: 'OpenIn',
                async onClick() {
                  const contentFragment = await guestConnection.host.contentFragment.getContentFragment();
                  console.log(contentFragment.path);
                  console.log(contentFragment.model);

                  const modalURL =
                    "/index.html#" +
                    generatePath(
                      "/content-fragment/:fragment/create-variations-from-audiences-modal",
                      {
                        // Set the :selection React route parameter to an encoded, delimited list of paths of the selected content fragments
                        fragment: encodeURIComponent(contentFragment.path),
                      }
                    );

                  console.log("Modal URL: ", modalURL);

                  guestConnection.host.modal.showUrl({
                    title: "Create Variations from Audiences",
                    url: modalURL,
                  });
                },
              },
            ];
          },
        },
      }
    });
  };
  init().catch(console.error);

  return <Text>IFrame for integration with Host (AEM)...</Text>;
}

export default ExtensionRegistration;
