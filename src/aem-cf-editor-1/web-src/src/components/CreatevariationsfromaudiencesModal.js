/*
 * <license header>
 */

import React, { useState, useEffect } from "react";
import { attach } from "@adobe/uix-guest";
import {
  Flex,
  Provider,
  Content,
  defaultTheme,
  Text,
  ButtonGroup,
  Button,
  ListView,
  Item,
  Section
} from "@adobe/react-spectrum";
import actionWebInvoke from '../utils';
import allActions from '../config.json';
import { extensionId } from "./Constants";
import Spinner from './Spinner';
import { useParams } from "react-router-dom";

export default function () {
  const [guestConnection, setGuestConnection] = useState();
  const [actionInvokeInProgress, setActionInvokeInProgress] = useState(false);
  const [actionResponse, setActionResponse] = useState();
  const [audiences, setAudiences] = useState([]);
  const [selectedAudiences, setSelectedAudiences] = useState([]);
  const [activities, setActivities] = useState([]);

  let { fragment } = useParams();

  useEffect(() => {
    (async () => {
      const guestConnection = await attach({ id: extensionId });
      // const api = await guestConnection.host.dataApi.get();
      // api.setValue('variations', 'test');
  
      setGuestConnection(guestConnection);
      fetchActivities(guestConnection);
    })();
  }, []);

  const onCloseHandler = () => {
    guestConnection.host.modal.close();
  };

  let rows = [
    { id: 1, name: 'Charizard' },
    { id: 2, name: 'Blastoise' },
    { id: 3, name: 'Venusaur' },
    { id: 4, name: 'Pikachu' }
  ];

  if (!guestConnection) {
    return <Spinner />
  // } else if (actionInvokeInProgress) {
    // return <Spinner />
    // } else if (actionResponse) {
    //   console.log(actionResponse);
  } else {
    return (
      <Provider theme={defaultTheme} colorScheme='light'>
        <Content width="100%">
          <Flex direction='row' width='100%' gap='size-100' minHeight='100%'>
            <Flex direction='column' width='100%'>
              <Text>Activities</Text>
              <ListView
                width="100%"
                aria-label="ListView with controlled selection"
                selectionMode="single"
                items={activities}
                selectionStyle="highlight"
                onSelectionChange={(selection) => fetchAudiences(selection)}
              >

                {(item) => (
                  <Item key={item.id}>
                    {item.name}
                  </Item>
                )}

              </ListView>
            </Flex>

            <Flex direction='column' width='100%'>
              <Text>Audiences</Text>
              <ListView
                width="100%"
                aria-label="ListView with controlled selection"
                selectionMode="multiple"
                items={audiences}
                onSelectionChange={(selection) => {
                  console.log(selectedAudiences);
                  Object.entries(selection).forEach((item) => {
                    console.log(item[1]); 
                    // setSelectedAudiences([item[1], ...selectedAudiences]);
                    if(!selectedAudiences.includes(item[1]))
                      // setSelectedAudiences(old => [...old, item[1]])
                      selectedAudiences.push(item[1]);
                  });
                  console.log(selectedAudiences); 
                  // setSelectedAudiences(selection)
                }}
              >

                {(item) => (
                  <Item key={item.name}>
                    {item.name}
                  </Item>
                )}

              </ListView>
            </Flex>
          </Flex>
          <Flex width="100%" justifyContent="end" alignItems="center" marginTop="size-400">
            <ButtonGroup align="end">
              <Button variant="primary" onPress={createVariations}>Create Audiences</Button>
            </ButtonGroup>
          </Flex>
        </Content >
      </Provider >

    );
    // return (
    //   <Provider theme={defaultTheme} colorScheme='light'>
    //     <Content width="100%">
    //       <Text>Create Variations from Audiences v2</Text>
    //       <Flex width="100%" justifyContent="end" alignItems="center" marginTop="size-400">
    //         <ButtonGroup align="end">
    //           <Button variant="primary" onClick={onCloseHandler}>Close Modal</Button>
    //         </ButtonGroup>
    //       </Flex>
    //     </Content>
    //   </Provider>
    // );
  }

  async function createVariations() {
    setActionInvokeInProgress(true);
    const headers = {
      'Authorization': 'Bearer ' + guestConnection.sharedContext.get('auth').imsToken,
      'x-gw-ims-org-id': guestConnection.sharedContext.get('auth').imsOrg
    };

    const {model, path} = await guestConnection.host.contentFragment.getContentFragment();

    const params = {
      aemHost: `https://${guestConnection.sharedContext.get('aemHost')}`,
      selectedAudiences: selectedAudiences,
      modelPath: model.path,
      fragmentPath: path.replace('/content/dam', '/api/assets')
    };

    console.log(`${params.aemHost}${params.fragmentPath}`);

    const action = 'create-variations';

    try {
      // Invoke Adobe I/O Runtime action with the configured headers and parameters
      const actionResponse = await actionWebInvoke(allActions[action], headers, params);

      // Set the response from the Adobe I/O Runtime action
      setActionResponse(actionResponse);
      console.log(actionResponse);
      // setAudiences(actionResponse);

      console.log(`Response from ${action}:`, actionResponse);
      onCloseHandler();
      // guestConnection.host.modal.close(); //.then(() => window.location.reload(true));

    } catch (e) {
      // Log and store any errors
      console.error(e)
    }

    // Set the action as no longer being invoked, so the loading spinner is hidden
    setActionInvokeInProgress(false);


  }

  async function fetchAudiences(selection) {
    setActionInvokeInProgress(true);
    const headers = {
      'Authorization': 'Bearer ' + guestConnection.sharedContext.get('auth').imsToken,
      'x-gw-ims-org-id': guestConnection.sharedContext.get('auth').imsOrg
    };

    const params = {
      aemHost: `https://${guestConnection.sharedContext.get('aemHost')}`
    };

    const action = 'fetch-audiences';

    try {
      // Invoke Adobe I/O Runtime action with the configured headers and parameters
      const actionResponse = await actionWebInvoke(allActions[action], headers, params);

      // Set the response from the Adobe I/O Runtime action
      setActionResponse(actionResponse);
      console.log(actionResponse);
      setAudiences(actionResponse);

      console.log(`Response from ${action}:`, actionResponse)
    } catch (e) {
      // Log and store any errors
      console.error(e)
    }

    // Set the action as no longer being invoked, so the loading spinner is hidden
    setActionInvokeInProgress(false);
  }

  async function fetchActivities(conn) {
    setActionInvokeInProgress(true);
    const headers = {
      'Authorization': 'Bearer ' + conn.sharedContext.get('auth').imsToken,
      'x-gw-ims-org-id': conn.sharedContext.get('auth').imsOrg
    };

    const params = {
      aemHost: `https://${conn.sharedContext.get('aemHost')}`
    };

    const action = 'fetch-activities';

    try {
      // Invoke Adobe I/O Runtime action with the configured headers and parameters
      const actionResponse = await actionWebInvoke(allActions[action], headers, params);

      // Set the response from the Adobe I/O Runtime action
      setActionResponse(actionResponse);
      console.log(actionResponse);
      setActivities(actionResponse);

      console.log(`Response from ${action}:`, actionResponse)
    } catch (e) {
      // Log and store any errors
      console.error(e)
    }

    // Set the action as no longer being invoked, so the loading spinner is hidden
    setActionInvokeInProgress(false);
  }
}
