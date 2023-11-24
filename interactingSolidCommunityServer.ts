import { createDpopHeader, generateDpopKeyPair } from '@inrupt/solid-client-authn-core';
import { buildAuthenticatedFetch } from '@inrupt/solid-client-authn-core';
import * as fs from 'fs';

//import fetch from "node-fetch";
import fetch from 'cross-fetch';
import { userInfo } from 'os';

const pw = `K\\LX9P(*o}yA7/bldx7Y?`

const getSecret = async(): Promise<any[]> => {

const response0 = await fetch('https://solid.interactions.ics.unisg.ch/idp/credentials/', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        // The email/password fields are those of your account.
        // The name field will be used when generating the ID of your token.
        body: JSON.stringify({ email: 'lukas.heaven@gmail.com', password: pw, name: 'token1' }),
    });
      
      // These are the identifier and secret of your token.
      // Store the secret somewhere safe as there is no way to request it again from the server!
      const { id, secret } = await response0.json();
      console.log("--This is id", id, "This is secret: ", secret);

    return [id,secret];
  }

const getToken = async (id: any, secret: any): Promise<any[]> =>  {
      // A key pair is needed for encryption. v
      // This function from `solid-client-authn` generates such a pair for you.
      const dpopKey = await generateDpopKeyPair();
      
      // These are the ID and secret generated in the previous step.
      // Both the ID and the secret need to be form-encoded.
      const authString = `${encodeURIComponent(id)}:${encodeURIComponent(secret)}`;
      // This URL can be found by looking at the "token_endpoint" field at
      const tokenUrl = 'https://solid.interactions.ics.unisg.ch/.oidc/token';
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          // The header needs to be in base64 encoding.
          authorization: `Basic ${Buffer.from(authString).toString('base64')}`,
          'content-type': 'application/x-www-form-urlencoded',
          dpop: await createDpopHeader(tokenUrl, 'POST', dpopKey),
        },
        body: 'grant_type=client_credentials&scope=webid',
      });

      const json = await response.json()
      console.log(json)

      // This is the Access token that will be used to do an authenticated request to the server.
      // The JSON also contains an "expires_in" field in seconds, 
      // which you can use to know when you need request a new Access token.
      const { access_token: accessToken } = json;
      console.log("--This is access token:", accessToken);
      console.log("--This is dpop: ", dpopKey)

     return [dpopKey, accessToken];
}


 
 const runAsyncFunctions = async () => {
   //Get id an secret 
   const idInfo = await getSecret();
  //  console.log("*** The secret and id are: ", idInfo);
  
  //Get token and key
  const token = await getToken(idInfo[0], idInfo[1]);
  // console.log("*** The token is: ", token);
   
  // The DPoP key needs to be the same key as the one used in the previous step.
  // The Access token is the one generated in the previous step.
  const authFetch = await buildAuthenticatedFetch(fetch, token[1], { dpopKey: token[0] });
  // authFetch can now be used as a standard fetch function that will authenticate as your WebID.
  // This request will do a simple GET for example.
  const response = await authFetch('https://solid.interactions.ics.unisg.ch/lukas-ubicomp/test/.acl');

  console.log(response)
  console.log(await response.text())

  // const aclResponse = await authFetch('https://solid.interactions.ics.unisg.ch/lukas-ubicomp/.acl');

  // const aclText = await aclResponse.text()
  // console.log(aclText)

  // const createContaierResponse = await authFetch('https://solid.interactions.ics.unisg.ch/lukas-ubicomp/gazeData/', {
  //   method: 'PUT'
  // });

  // console.log(createContaierResponse)

  // const aclText = `# Root ACL resource for the agent account
  // @prefix acl: <http://www.w3.org/ns/auth/acl#>.
  // @prefix foaf: <http://xmlns.com/foaf/0.1/>.
  
  // # The homepage is readable by the public
  // <#public>
  //     a acl:Authorization;
  //     acl:agentClass foaf:Agent;
  //     acl:accessTo <./>;
  //     acl:mode acl:Read.
  
  // # The owner has full access to every resource in their pod.
  // # Other agents have no access rights,
  // # unless specifically authorized in other .acl resources.
  // <#owner>
  //     a acl:Authorization;
  //     acl:agent <https://solid.interactions.ics.unisg.ch/lukas-ubicomp/profile/card#me>;
  //     # Optional owner email, to be used for account recovery:
  //     acl:agent <mailto:lukas.heaven@gmail.com>;
  //     # Set the access to the root storage folder itself
  //     acl:accessTo <./>;
  //     # All resources will inherit this authorization, by default
  //     acl:default <./>;
  //     # The owner has all of the access modes allowed
  //     acl:mode
  //         acl:Read, acl:Write, acl:Control.`

  // const createResource = await authFetch('https://solid.interactions.ics.unisg.ch/lukas-ubicomp/test/.acl', {
  //   method: 'PUT',
  //   headers: {
  //      "Content-Type": "text/turtle",
  //   },
  //   body: aclText
  // });

  // console.log(createResource)

  // const aclRule = `
  // <#auth2LukaB> a acl:Authorization;
  // acl:accessTo <https://solid.interactions.ics.unisg.ch/lukas-ubicomp/test/myhobbies.txt>;
  // acl:mode acl:Read;
  // acl:agent <https://solid.interactions.ics.unisg.ch/LukaBPod/profile/card#me>,
  // <mailto:luka.bekavac@student.unisg.ch> .
  // `
  // // acl:default <https://solid.interactions.ics.unisg.ch/lukas-ubicomp/test/>.
  // const n3PatchData = `
  // @prefix acl: <http://www.w3.org/ns/auth/acl#>.
  // @prefix solid: <http://www.w3.org/ns/solid/terms#>.
  // _:rename a solid:InsertDeletePatch;
  // solid:inserts {
  //     ${aclRule}
  // }.`;


  // const addACLRule = await authFetch('https://solid.interactions.ics.unisg.ch/lukas-ubicomp/test/.acl', {
  //   method: 'PATCH', 
  //   headers: {
  //     "Content-Type": "text/n3",
  //   },
  //   body: n3PatchData
  // });

  // console.log(addACLRule)


  const rule = await authFetch('https://solid.interactions.ics.unisg.ch/lukas-ubicomp/test/.acl', {
    method: 'GET', 
  });

  console.log(await rule.text())

  //   const addACLRule = await authFetch('https://solid.interactions.ics.unisg.ch/LukaBPod/test/myFriendsInfo.txt', {
  //   method: 'GET', 
  // });

  // console.log(await addACLRule.text())

}

runAsyncFunctions()
