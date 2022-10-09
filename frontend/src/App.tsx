import React, { useEffect, useState } from "react";
import { Wallet } from "fuels";
import "./App.css";
// Importa la fábrica de contratos -- puedes encontrar el nombre en index.ts.
// También puedes hacer comando + espacio y el compilador te sugerirá el nombre correcto.
import { RsvpContractAbi__factory } from "./contracts";
// La dirección del contrato desplegado el Fuel testnet
const CONTRACT_ID = "0x9771f7845de02f65a4e8ffa18e89e7ca7a335fd31d396b543f0b094e3078d7b1";
//la clave privada de createWallet.js
const WALLET_SECRET = "0x3d8abe4a5c8debf7036ddf5857a11df4ea2b99ba27d73407ac1df4d4c7c5c61b"
// Crear un Wallet a partir del secretKey dado en este caso
// La que hemos configurado en el chainConfig.json
const wallet = new Wallet(WALLET_SECRET, "https://node-beta-1.fuel.network/graphql");
// Conecta la instancia del contrato con el contrato desplegado
// dirección utilizando el monedero dado.
const contract = RsvpContractAbi__factory.connect(CONTRACT_ID, wallet);

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