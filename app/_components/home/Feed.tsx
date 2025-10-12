"use client";
const mock = [
  { type:"news", title:"Training updates ahead of the derby", text:"Key players fit; tactical tweaks planned."},
  { type:"video", title:"Behind the scenes", text:"30-sec short from today’s session."},
  { type:"poll", title:"Who is your MOTM?", text:"Cast your vote now."}
];
export default function Feed(){
  return (
    <section className="grid md:grid-cols-2 gap-4">
      {mock.map((c,i)=>(
        <article key={i} className="card">
          <h3 className="font-semibold mb-2">{c.title}</h3>
          <p className="muted">{c.text}</p>
        </article>
      ))}
    </section>
  );
}

