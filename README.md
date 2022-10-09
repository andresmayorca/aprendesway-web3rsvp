# Construyendo en Fuel con Sway - Web3RSVP

En este taller, construiremos una dapp fullstack sobre Fuel.

Esta aplicación es una referencia arquitectónica básica para una plataforma de creación y gestión de eventos, similar a Eventbrite o Luma. Los usuarios pueden crear un nuevo evento y RSVP a un evento existente. Esta es la funcionalidad que vamos a construir en este taller:

- Crear una función en el contrato inteligente para crear un nuevo evento
- Crear una función en el contrato inteligente para RSVP a un evento existente.

![Screen Shot 2022-10-06 at 10 09 20 AM](https://user-images.githubusercontent.com/15346823/194375908-810ea03a-ba0e-4f21-8caa-b4aa2588aad3.png)

Vamos a desglosar las tareas asociadas a cada función:

*Para crear una función o para crear un nuevo evento, el programa tendrá que ser capaz de manejar lo siguiente.*

- el usuario debe pasar el nombre del evento, una cantidad de depósito para que los asistentes paguen para poder confirmar su asistencia al evento, y la capacidad máxima para el evento.

- Una vez que el usuario pasa esta información, nuestro programa debe crear un evento, representado como una estructura de datos llamada struct.

- Como se trata de una plataforma de eventos, nuestro programa debe ser capaz de manejar múltiples eventos a la vez. Por lo tanto, necesitamos un mecanismo para almacenar múltiples eventos.

- Para almacenar múltiples eventos, utilizaremos un mapa hash, conocido también como tabla hash en otros lenguajes de programación. Este mapa hash asignará un identificador único, que llamaremos eventId, a un evento (que se representa como una estructura).

*Para crear una función que gestione el RSVP de un usuario, o la confirmación de su asistencia al evento, nuestro programa tendrá que ser capaz de manejar lo siguiente*

- Deberíamos tener un mecanismo para identificar el evento al que el usuario quiere confirmar su asistencia

*Algunos recursos que pueden ser útiles:*

- [Docs de Fuel](https://fuellabs.github.io/fuel-docs/master/)
- [Docs de Sway](https://fuellabs.github.io/sway/v0.19.2/)
- [Discord de Fuel](discord.gg/fuelnetwork) - Pide ayuda.

## Instalación.

1. Instala `cargo` usando [`rustup`](https://www.rust-lang.org/tools/install)

    Mac y Linux:
    ```bash
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
    ```

2. Comprueba la versión:

    ```bash
    $ cargo --version
    cargo 1.62.0
    ```

3. Instala `forc` usando [`fuelup`](https://fuellabs.github.io/sway/v0.18.1/introduction/installation.html#installing-from-pre-compiled-binaries)

    Mac y Linux:
    ```bash
    curl --proto '=https' --tlsv1.2 -sSf \
    https://fuellabs.github.io/fuelup/fuelup-init.sh | sh
    ```

4. Comprueba la versión:

    ```bash
    $ forc --version
    forc 0.18.1
    ```
    
### Editor

Puedes utilizar el editor que prefieras.

- [VSCode plugin](https://marketplace.visualstudio.com/items?itemName=FuelLabs.sway-vscode-plugin)
- [Vim highlighting](https://github.com/FuelLabs/sway.vim)

## Getting Started

Esto guiará a los desarrolladores a través de la escritura de un contrato inteligente en Sway, una prueba simple, el despliegue en Fuel, y la construcción de un frontend.

Antes de empezar, puede ser útil entender la terminología que se utilizará a lo largo de los documentos y cómo se relacionan entre sí:

- **Fuel**: La Blockchain Fuel.
- **FuelVM**: La máquina virtual que alimenta a Fuel.
- **Sway**: Es un Lenguaje de dominio especifico (DSL) creado para la FuelVM. Este lenguaje esta inspirado en Rust.
- **Forc**: Gestor de paquetes para Sway, similar a Cargo para Rust.

## Entender los tipos de programas Sway

Hay cuatro tipos de programas en Sway:

- `contract`
- `predicate`
- `script`
- `library`

Los contratos, predicados y scripts pueden producir artefactos utilizables en la cadena de bloques, mientras que una biblioteca es simplemente un proyecto diseñado para la reutilización del código y no es directamente desplegable.

Las principales características de un contrato inteligente que lo diferencian de los scripts o predicados es que es invocable y con estado.

Un script es un bytecode ejecutable en la cadena que puede llamar a los contratos para realizar alguna tarea. No representa la propiedad de ningún recurso y no puede ser llamado por un contrato.

## Crear un nuevo proyecto en Fuel.

**Comienza creando una nueva carpeta vacía, la llamaremos `Web3RSVP`.**

### Escribir el contrato.

Luego, con `forc` instalado, crea un proyecto dentro de tu carpeta `Web3RSVP`:

```sh
$ cd Web3RSVP
$ forc new eventPlatform
To compile, use `forc build`, and to run tests use `forc test`

---
```

Aquí estara el proyecto que `Forc` ha inicializado:

```console
$ tree Web3RSVP
eventPlatform
├── Cargo.toml
├── Forc.toml
├── src
│   └── main.sw
└── tests
    └── harness.rs
```

## Definiendo la ABI

Primero, definiremos la ABI. Una ABI define una interfaz, y no hay ningún cuerpo de función en la ABI. Un contrato debe definir o importar una declaración ABI e implementarla. Se considera que la mejor práctica es definir la ABI en una biblioteca separada e importarla en el contrato porque esto permite a los que llaman al contrato importar y utilizar la ABI en los scripts para llamar a su contrato.

Para definir el ABI como una biblioteca, crearemos un nuevo archivo en la carpeta `src`. Crea un nuevo archivo llamado `event_platform.sw`.  

Esta es la estructura de tu proyecto:
Aquí está el proyecto que `Forc` ha inicializado:

```console
eventPlatform
├── Cargo.toml
├── Forc.toml
├── src
│   └── main.sw
│   └── event_platform.sw
└── tests
    └── harness.rs
```

Añade el siguiente código a tu archivo ABI, `event_platform.sw`: 

``` rust
library event_platform;

use std::{
    identity::Identity,
    contract_id::ContractId,
};

abi eventPlatform {
    #[storage(read, write)]
    fn create_event(maxCapacity: u64, deposit: u64, eventName: str[10]) -> Event;

    #[storage(read, write)]
    fn rsvp(eventId: u64) -> Event;
}

//La estructura de eventos se define aquí para ser utilizada desde otros contratos cuando se llama a la ABI. 
pub struct Event {
    uniqueId: u64,
    maxCapacity: u64, 
    deposit: u64, 
    owner: Identity,
    name: str[10],
    numOfRSVPs: u64
}

```

Ahora, en el archivo `main.sw`, implementaremos estas funciones. Aquí es donde escribirás los cuerpos de las funciones. Este es el aspecto que debería tener tu archivo `main.sw`:

```rust
contract;

dep event_platform;
use event_platform::*;

use std::{
    identity::Identity,
    contract_id::ContractId,
    storage::StorageMap,
    chain::auth::{AuthError, msg_sender},
    context::{call_frames::msg_asset_id, msg_amount, this_balance},
    result::Result,
};

storage {
    events: StorageMap<u64, Event> = StorageMap {},
    event_id_counter: u64 = 0,
}

impl eventPlatform for Contract{
    #[storage(read, write)]
    fn create_event(capacity: u64, price: u64, eventName: str[10]) -> Event {
       let campaign_id = storage.event_id_counter;
       let newEvent = Event {
        uniqueId: campaign_id,
        maxCapacity: capacity,
        deposit: price,
        owner: msg_sender().unwrap(),
        name: eventName,
        numOfRSVPs: 0
       };
 

       storage.events.insert(campaign_id, newEvent);
       storage.event_id_counter += 1;
       let mut selectedEvent = storage.events.get(storage.event_id_counter -1);
       return selectedEvent;
    }

    #[storage(read, write)]
    fn rsvp(eventId: u64) -> Event {
    //las variables son inmutables por defecto, por lo que es necesario utilizar la palabra clave mut
    let mut selectedEvent = storage.events.get(eventId);
    if (eventId > storage.event_id_counter) {
        //si el usuario pasa un eventID que no existe, devolvera el primer evento.
        let fallback = storage.events.get(0);
        return fallback;
    }
    //enviar el dinero del msg_sender al propietario del evento seleccionado
    selectedEvent.numOfRSVPs += 1;
    storage.events.insert(eventId, selectedEvent);
    return selectedEvent;
    }
}
```
### Construir el contrato

Desde el directorio `web3rsvp/eventPlatform`, ejecute el siguiente comando para construir su contrato:

```console
$ forc build
  Compiled library "core".
  Compiled library "std".
  Compiled contract "counter_contract".
  Bytecode size is 224 bytes.
```

### Despliegue del contrato

Ahora es el momento de desplegar el contrato en la red de pruebas. Mostraremos cómo hacer esto usando `forc` desde la línea de comandos, pero también puedes hacerlo usando el [Rust SDK](https://github.com/FuelLabs/fuels-rs#deploying-a-sway-contract) or the [TypeScript SDK](https://github.com/FuelLabs/fuels-ts/#deploying-contracts).

Para desplegar un contrato, es necesario tener un monedero para firmar la transacción y monedas para pagar el gas. Primero, crearemos un monedero.

### Instalar el Wallet CLI

Sigue [estos pasos para configurar un monedero y crear una cuenta](https://github.com/FuelLabs/forc-wallet#forc-wallet).

Después de teclear una contraseña, asegúrate de guardar la frase mnemotécnica que sale.

Con esto, usted obtendrá una dirección de combustible que se parece a esto `fuel1efz7lf36w9da9jekqzyuzqsfrqrlzwtt3j3clvemm6eru8fe9nvqj5kar8`. Guarde esta dirección, ya que la necesitará para firmar las transacciones cuando despleguemos el contrato.

#### Obtener Testnet Coins

Con la dirección de tu cuenta en la mano, dirígete al [testnet faucet](https://faucet-beta-1.fuel.network/) para obtener algunas monedas enviadas a tu cartera.

## Despliegue en Testnet

Ahora que tienes un monedero, puedes desplegarlo con `forc deploy` y pasando el endpoint de testnet así:

`forc deploy --url https://node-beta-1.fuel.network/graphql --gas-price 1`

> **Nota**
> Establecemos el precio de la gasolina en 1. Sin esta bandera, el precio del gas es 0 por defecto y la transacción fallará.

El terminal te pedirá la dirección del monedero con el que quieres firmar esta transacción, pega la dirección que has guardado antes, tiene este aspecto `fuel1efz7lf36w9da9jekqzyuzqsfrqrlzwtt3j3clvemm6eru8fe9nvqj5kar8`.

El terminal mostrará el identificador de tu contrato. Asegúrate de guardarlo ya que lo necesitarás para construir un frontend con el SDK de Typescript.

La terminal mostrará un `id de transacción para firmar` y le pedirá una firma. Abra una nueva pestaña de la terminal y vea sus cuentas ejecutando `forc wallet list`. Si has seguido estos pasos, te darás cuenta de que sólo tienes una cuenta, `0`.

Toma el `id de transacción` de tu otra terminal y firma con una cuenta específica ejecutando el siguiente comando:

``` console
forc wallet sign` + `[transaction id here, without brackets]` + `[the account number, without brackets]`
```

Tu comando debería ser así:

``` console
$ forc wallet sign 16d7a8f9d15cfba1bd000d3f99cd4077dfa1fce2a6de83887afc3f739d6c84df 0
Please enter your password to decrypt initialized wallet's phrases:
Signature: 736dec3e92711da9f52bed7ad4e51e3ec1c9390f4b05caf10743229295ffd5c1c08a4ca477afa85909173af3feeda7c607af5109ef6eb72b6b40b3484db2332c
```

Introduce tu contraseña cuando se te pida, y obtendrás una "firma". Guarde esa firma, vuelva a su otra ventana de terminal y péguela en el lugar donde se le pide que "proporcione una firma para esta transacción".

Por último, obtendrá un `Id de transacción` para confirmar que su contrato ha sido desplegado. Con este ID, puedes dirigirte al [explorador de bloques] (https://fuellabs.github.io/block-explorer-v2/) y ver tu contrato.

> Nota
> Debe anteponer a su `TransactionId` el prefijo `0x` para verlo en el explorador de bloques

## Crear un frontend para interactuar con el contrato

Ahora vamos a

1. **Inicializar un proyecto React.**
2. **Instalar las dependencias del SDK de `fuels`.**
3. **Modificar la App.**
4. **Ejecutar nuestro proyecto.**

## Inicializar un proyecto React

Para dividir mejor nuestro proyecto vamos a crear una nueva carpeta `frontend` e inicializar nuestro proyecto dentro de ella.

En la terminal, sube un directorio e inicializa un proyecto react usando [`Create React App`](https://create-react-app.dev/).

```console
$ cd ..
$ npx create-react-app frontend --template typescript
Success! Created frontend at Fuel/Web3RSVP/frontend
```

Ahora deberías tener tu carpeta exterior, `Web3RSVP`, con dos carpetas dentro: `frontend` y `rsvpContract`.

![project folder structure](./images/quickstart-folder-structure.png)

### Instalar las dependencias del SDK de `fuels`.

En este paso necesitamos instalar 3 dependencias para el proyecto:

1. `fuels`: El paquete paraguas que incluye todas las herramientas principales; `Wallet`, `Contracts`, `Providers` y más.
2. `fuelchain`: Fuelchain es el generador de ABI TypeScript.
3. `typechain-target-fuels`: El objetivo de Fuelchain es el intérprete específico para la [Fuel ABI Spec](https://github.com/FuelLabs/fuel-specs/blob/master/specs/protocol/abi.md).

> ABI son las siglas de Application Binary Interface. Las ABI's informan a la aplicación de la interfaz para interactuar con la VM, en otras palabras, proporcionan información a la APP como qué métodos tiene un contrato, qué params, tipos espera, etc...

### Instalar

Entra a la carpeta `frontend`, luego instala las dependencias:

```console
$ cd frontend
$ npm install fuels --save
added 65 packages, and audited 1493 packages in 4s
$ npm install fuelchain typechain-target-fuels --save-dev
added 33 packages, and audited 1526 packages in 2s
```

### Generación de tipos de contrato

Para facilitar la interacción con nuestro contrato utilizamos `fuelchain` para interpretar el ABI JSON de salida de nuestro contrato. Este JSON fue creado en el momento en que ejecutamos el `forc build` para compilar nuestro Sway Contract en binario.

Si ves la carpeta `Web3RSVP/rsvpContract/out` podrás ver el ABI JSON allí. Si quieres saber más, lee el [ABI Specs here](https://github.com/FuelLabs/fuel-specs/blob/master/specs/protocol/abi.md).

Dentro de `Web3RSVP/frontend` ejecuta;

```console
$ npx fuelchain --target=fuels --out-dir=./src/contracts ../rsvpContract/out/debug/*-abi.json
Successfully generated 4 typings!
```

Ahora deberías encontrar una nueva carpeta `Web3RSVP/frontend/src/contracts`. Esta carpeta fue auto-generada por nuestro comando `fuelchain`, estos archivos abstraen el trabajo que tendríamos que hacer para crear una instancia de contrato, y generan una interfaz completa de TypeScript para el Contrato, facilitando el desarrollo.

### Crear una cartera (de nuevo)

Para interactuar con la red Fuel tenemos que enviar transacciones firmadas con fondos suficientes para cubrir las tarifas de la red. El SDK de Fuel TS no soporta actualmente integraciones de Wallet, lo que nos obliga a tener un wallet no seguro dentro de la WebApp usando una PrivateKey.

> **Nota**
>Esto debe hacerse sólo con fines de desarrollo. Nunca exponga una aplicación web con una clave privada dentro. The Fuel Wallet está en desarrollo activo, siga el progreso [aquí](https://github.com/FuelLabs/fuels-wallet).
>
> **Nota**
> El equipo está trabajando para simplificar el proceso de creación de una cartera, y eliminar la necesidad de crear una cartera dos veces. Estate atento a estas actualizaciones.

En la raíz del proyecto del frontend crea un archivo, createWallet.js

```js
const { Wallet } = require("fuels");

const wallet = Wallet.generate();

console.log("address", wallet.address.toString());
console.log("private key", wallet.privateKey);
```

En el terminal, ejecute el siguiente comando:

``` console
$ node createWallet.js
address fuel160ek8t7fzz89wzl595yz0rjrgj3xezjp6pujxzt2chn70jrdylus5apcuq
private key 0x719fb4da652f2bd4ad25ce04f4c2e491926605b40e5475a80551be68d57e0fcb
```

> **Nota**
> Debe utilizar la dirección y la clave privada generadas.

Guarde la dirección generada y la clave privada. Necesitará la clave privada más tarde para establecerla como un valor de cadena para una variable `WALLET_SECRET` en su archivo `App.tsx`. Más adelante se hablará de ello.

Primero, toma la dirección de tu cartera y úsala para obtener algunas monedas de [el grifo de testnet](https://faucet-beta-1.fuel.network/).

Ahora estás listo para construir y enviar ⛽

### Modificar la aplicación

Dentro de la carpeta `frontend` vamos a añadir el código que interactúa con nuestro contrato.
Lee los comentarios para ayudarte a entender las partes de la App.

Cambia el archivo `Web3RSVP/frontend/src/App.tsx` por:

```js
import React, { useEffect, useState } from "react";
import { Wallet } from "fuels";
import "./App.css";
// Importa la fábrica de contratos -- puedes encontrar el nombre en index.ts.
// También puedes hacer comando + espacio y el compilador te sugerirá el nombre correcto.
import { RsvpContractAbi__factory } from "./contracts";
// La dirección del contrato desplegado el Fuel testnet
const CONTRACT_ID = "<YOUR-CONTRACT-ADDRESS-HERE>";
//la clave privada de createWallet.js
const WALLET_SECRET = "<YOUR-GENERATED-PRIVATE-KEY>"
// Crear un Wallet a partir del secretKey dado en este caso
// La que hemos configurado en el chainConfig.json
const wallet = new Wallet(WALLET_SECRET, "https://node-beta-1.fuel.network/graphql");
// Conecta la instancia del contrato con el contrato desplegado
// dirección utilizando el monedero dado.
const contract = Abi__factory.connect(CONTRACT_ID, wallet);

export default function App(){
  const [loading, setLoading] = useState(false);
  const [eventId, setEventId] = useState('');
  const [eventName, setEventName] = useState('')
  const [maxCap, setMaxCap] = useState(0)
  const [deposit, setDeposit] = useState(0)
  const [eventCreation, setEventCreation] = useState(false);
  const [rsvpConfirmed, setRSVPConfirmed] = useState(false);

  useEffect(() => {
    // Actualizar el título del documento utilizando la API del navegador
    console.log("eventName", eventName);
    console.log("deposit", deposit);
    console.log("max cap", maxCap);
  },[eventName, maxCap, deposit]);

  async function rsvpToEvent(){
    setLoading(true);
    try {
      const { value } = await contract.functions.rsvp(eventId).txParams({gasPrice: 1}).call();
      console.log("RSVP'd to the following event", value);
      console.log("deposit value", value.deposit.toString());
      setEventName(value.name.toString());
      setEventId(value.uniqueId.toString());
      setMaxCap(value.maxCapacity.toNumber());
      setDeposit(value.deposit.toNumber());
      console.log("event name", value.name);
      console.log("event capacity", value.maxCapacity.toString());
      console.log("eventID", value.uniqueId.toString()) 
      setRSVPConfirmed(true);
      alert("rsvp successful")
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false)
    }
  }

  async function createEvent(e: any){
    e.preventDefault();
    setLoading(true);
    try {
      console.log("creating event")
      const { value } = await contract.functions.create_event(maxCap, deposit, eventName).txParams({gasPrice: 1}).call();

      console.log("return of create event", value);
      console.log("deposit value", value.deposit.toString());
      console.log("event name", value.name);
      console.log("event capacity", value.maxCapacity.toString());
      console.log("eventID", value.uniqueId.toString())
      setEventId(value.uniqueId.toString())
      setEventCreation(true);
      alert('Event created');
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false);
    }
  }
return (
  <div>
    <form id="createEventForm" onSubmit={createEvent}>
    <input value = {eventName} onChange={e => setEventName(e.target.value) }name="eventName" type="text" placeholder="Enter event name" />
      <input value = {maxCap} onChange={e => setMaxCap(+e.target.value)} name="maxCapacity" type="text" placeholder="Enter max capacity" />
      <input value = {deposit} onChange={e => setDeposit(+e.target.value)} name="price" type="number" placeholder="Enter price" />
      <button disabled={loading}>
        {loading ? "creating..." : "create"}
      </button>
    </form>
    <div>
      <input name="eventId" onChange={e => setEventId(e.target.value)} placeholder="pass in the eventID"/>
      <button onClick={rsvpToEvent}>RSVP</button>
    </div>
    <div> 
    {eventCreation &&
    <>
    <h1> New event created</h1>
    <h2> Event Name: {eventName} </h2>
    <h2> Event ID: {eventId}</h2>
    <h2>Max capacity: {maxCap}</h2>
    <h2>Deposit: {deposit}</h2>
    </>
    }
    </div> 
    <div>
    {rsvpConfirmed && <>
    <h1>RSVP Confirmed to the following event: {eventName}</h1>
    </>}
    </div>
  </div>
);
}
```

### Ejecuta tu proyecto

Ahora es el momento de divertirse ejecutando el proyecto en tu navegador;

Dentro de `Web3RSVP/frontend` ejecuta;

```console
$ npm start
Compiled successfully!

You can now view frontend in the browser.

  Local:            http://localhost:3001
  On Your Network:  http://192.168.4.48:3001

Note that the development build is not optimized.
To create a production build, use npm run build.
```

#### ✨⛽✨ Felicidades has completado tu primera DApp en Fuel ✨⛽✨

![Screen Shot 2022-10-06 at 10 08 26 AM](https://user-images.githubusercontent.com/15346823/194375753-4c5de0cd-eaf3-4ba7-8e25-efe8e082fa93.png)

Tweetéame [@camiinthisthang](https://twitter.com/camiinthisthang) y hazme saber que acabas de construir una dapp en Fuel, puede que te inviten a un grupo privado de constructores, que te inviten a la próxima cena de Fuel, que te den una alfa en el proyecto, o algo 👀.

>Nota: Para subir este proyecto a un repo de github, tendrás que eliminar el archivo `.git` que se crea automáticamente con `create-react-app`. Puedes hacerlo ejecutando el siguiente comando en `Web3RSVP/frontend`: `Rm -rf .git`. Entonces, estarás bien para añadir, confirmar y empujar estos archivos.

### Actualizar el contrato

Si realizas cambios en tu contrato, estos son los pasos que debes seguir para que tu frontend y tu contrato vuelvan a estar sincronizados:

- En el directorio del contrato, ejecuta `forc build`.
- En el directorio de su contrato, vuelva a desplegar el contrato ejecutando este comando y siguiendo los mismos pasos anteriores para firmar la transacción con su monedero: `forc deploy --url https://node-beta-1.fuel.network/graphql --gas-price 1`
- En tu directorio de frontend, vuelve a ejecutar este comando: `npx fuelchain --target=fuels --out-dir=./src/contracts ../rsvpContract/out/debug/*-abi.json`
- En su directorio de frontend, actualice el ID del contrato en su archivo `App.tsx`.

## ¿Necesitas ayuda?

Dirígete al [Fuel discord](https://discord.com/invite/fuelnetwork) para obtener ayuda.
