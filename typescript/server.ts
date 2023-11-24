import express, { Request, Response } from 'express';
import { createDpopHeader, generateDpopKeyPair } from '@inrupt/solid-client-authn-core';
import { buildAuthenticatedFetch } from '@inrupt/solid-client-authn-core';

const app = express();
const PORT = 3000;

import { fetch } from 'cross-fetch';

const pw = `K\\LX9P(*o}yA7/bldx7Y?`

const getSecret = async (): Promise<any[]> => {

    const response0 = await fetch('https://solid.interactions.ics.unisg.ch/idp/credentials/', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'lukas.heaven@gmail.com', password: pw, name: 'token1' }),
    });
    const { id, secret } = await response0.json();
    return [id, secret];
}

const getToken = async (id: any, secret: any): Promise<any[]> => {
    const dpopKey = await generateDpopKeyPair();
    const authString = `${encodeURIComponent(id)}:${encodeURIComponent(secret)}`;
    const tokenUrl = 'https://solid.interactions.ics.unisg.ch/.oidc/token';
    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            authorization: `Basic ${Buffer.from(authString).toString('base64')}`,
            'content-type': 'application/x-www-form-urlencoded',
            dpop: await createDpopHeader(tokenUrl, 'POST', dpopKey),
        },
        body: 'grant_type=client_credentials&scope=webid',
    });
    const json = await response.json()
    const { access_token: accessToken } = json;
    return [dpopKey, accessToken];
}

const getTurtleText = (schemaAction: string, clearName: string): string => {
    const text = `#use https://schema.org/SearchAction when an activity is classified as "Searching Activity"
        #use https://schema.org/CheckAction when an activity is classified as "Inspection Activity" 
        
        @prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
        @prefix foaf: <http://xmlns.com/foaf/0.1/> .
        @prefix prov: <http://www.w3.org/ns/prov#> .
        @prefix schema: <https://schema.org/> .
        @prefix bm: <http://bimerr.iot.linkeddata.es/def/occupancy-profile#> .
        
        <https://solid.interactions.ics.unisg.ch/lukas-ubicomp/gazeData/currentActivity.ttl> a prov:Activity, "${schemaAction}";
                                                                                      schema:name "${clearName}"^^xsd:string;
                                                                                      prov:wasAssociatedWith <https://solid.interactions.ics.unisg.ch/lukas-ubicomp/profile/card#me>;
                                                                                      prov:used <https://solid.interactions.ics.unisg.ch/lukas-ubicomp/gazeData/lukasTest.csv>;
                                                                                      prov:endedAtTime "${new Date()}"^^xsd:dateTime;
                                                                                      bm:probability  "0.87"^^xsd:float.
        <https://solid.interactions.ics.unisg.ch/lukas-ubicomp/profile/card#me> a foaf:Person, prov:Agent;
                                                                         foaf:name "Lukas Volk";
                                                                         foaf:mbox <mailto:lukas.volk@student.unisg.ch>.`
    return text
}


app.post('/classified/:classification', async (req: Request, res: Response) => {
    const classification: string = req.params.classification;
    console.log(`Received POST request for classification: ${classification}`);

    const num = parseInt(classification)
    let text: string;

    switch (num) {
        case 1:
            text = getTurtleText("schema:ReadAction", "Read")
            break;
        case 0:
            text = getTurtleText("schema:CheckAction", "Searching Activity")
            break;
        case 2:
            text = getTurtleText("schema:SearchAction", "Inspection Activity")
            break;
        default:
            console.log("Unknown Classification");
            text = ""
            break;
    }

    const idInfo = await getSecret();
    const token = await getToken(idInfo[0], idInfo[1]);
    const authFetch = await buildAuthenticatedFetch(fetch, token[1], { dpopKey: token[0] });

    const createContaierResponse = async () => await authFetch('https://solid.interactions.ics.unisg.ch/lukas-ubicomp/gazeData/', {
        method: 'PUT',
        headers: {
            "Content-Type": "text/turtle",
        },
        body: text
    });

    const response = await createContaierResponse()
    console.log("Solid responded with" + response.status)

    res.sendStatus(200);
});

app.post('/share', async (req: Request, res: Response) => {
    const idInfo = await getSecret();
    const token = await getToken(idInfo[0], idInfo[1]);
    const authFetch = await buildAuthenticatedFetch(fetch, token[1], { dpopKey: token[0] });

    console.log("sharing with luka")
  const aclRule = `
  <#auth2Luka> a acl:Authorization;
  acl:accessTo <https://solid.interactions.ics.unisg.ch/lukas-ubicomp/gazeData/>;
  acl:mode acl:Read;
  acl:agent <https://solid.interactions.ics.unisg.ch/LukaBPod/profile/card#me>,
  <mailto:jan.asd@student.unisg.ch>;
  acl:default <https://solid.interactions.ics.unisg.ch/lukas-ubicomp/gazeData/>.
  `
  const n3PatchData = `
  @prefix acl: <http://www.w3.org/ns/auth/acl#>.
  @prefix solid: <http://www.w3.org/ns/solid/terms#>.
  _:rename a solid:InsertDeletePatch;
  solid:inserts {
      ${aclRule}
  }.`;

  const addACLRule = await authFetch('https://solid.interactions.ics.unisg.ch/lukas-ubicomp/gazeData/.acl', {
    method: 'PATCH',
    headers: {
      "Content-Type": "text/n3",
    },
    body: n3PatchData
  });

  console.log("done with "+ addACLRule.status)
  res.sendStatus(200)
})

app.get('/friend', async (req: Request, res: Response) => {
    const idInfo = await getSecret();
    const token = await getToken(idInfo[0], idInfo[1]);
    const authFetch = await buildAuthenticatedFetch(fetch, token[1], { dpopKey: token[0] });

    const rule = await authFetch(
        'https://solid.interactions.ics.unisg.ch/LukaBPod/gazeData/currentActivity.ttl', {
        method: 'GET',
    });

    const text = await rule.text()
    const valuesInQuotes = text.match(/"([^"]*)"/g);
    let values: string[] = []
    let counter = 0
    if (valuesInQuotes) {
        for (let i = 0; i < valuesInQuotes.length; i++) {
            counter += 1
            const extractedValue = valuesInQuotes[i].replace(/"/g, ''); // Remove the quotes
            if (counter > 2) {
                // console.log(extractedValue)
                values.push(extractedValue)
            }
        }
    }

    const jsonData = {
        "activity": values[0],
        "timestamp": values[1],
        "probability": values[2],
        "friend": values[3]
    }

    console.log(values)
    res.json(jsonData)
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
