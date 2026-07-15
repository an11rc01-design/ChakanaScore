import { useEffect, useState } from "react";

const API_URL = "https://chakanascore.onrender.com";

export default function PantallaLED() {

  const [resultado, setResultado] = useState(null);

  useEffect(() => {

    async function cargar() {

      const r = await fetch(`${API_URL}/ultimo-publicado`);

      const datos = await r.json();

      setResultado(datos);

    }

    cargar();

    const intervalo = setInterval(cargar,1000);

    return ()=>clearInterval(intervalo);

  },[]);

  if(!resultado){

    return(

      <div style={{
        background:"#000",
        color:"white",
        height:"100vh",
        display:"flex",
        justifyContent:"center",
        alignItems:"center",
        fontSize:"45px"
      }}>

        Esperando competidor...

      </div>

    )

  }

  return(

<div style={{

height:"100vh",

background:"linear-gradient(#0b0f1d,#191919)",

display:"flex",

flexDirection:"column",

justifyContent:"center",

alignItems:"center",

color:"white"

}}>

<h3 style={{color:"#e4b04d"}}>

{resultado.categoria}

</h3>

<h1 style={{

fontSize:"75px",

margin:10

}}>

{resultado.nombre}

</h1>

<div style={{

display:"flex",

gap:"35px",

marginTop:"50px"

}}>

{[
resultado.jurado_1,
resultado.jurado_2,
resultado.jurado_3,
null,
null
].map((j,i)=>(

<div
key={i}
style={{

width:170,

height:170,

background:"#18223a",

border:"4px solid gold",

borderRadius:20,

display:"flex",

flexDirection:"column",

justifyContent:"center",

alignItems:"center"

}}>

<div style={{

fontSize:30,

color:"gold"

}}>

{i<3?`J${i+1}`:"🔒"}

</div>

<div style={{

fontSize:70,

fontWeight:"bold"

}}>

{j??"?"}

</div>

</div>

))}

</div>

<h2 style={{

marginTop:70,

fontSize:45,

color:"#e4b04d"

}}>

TOTAL PARCIAL

</h2>

<div style={{

fontSize:"120px",

fontWeight:"bold"

}}>

{resultado.jurado_1+resultado.jurado_2+resultado.jurado_3}

</div>

</div>

)

}