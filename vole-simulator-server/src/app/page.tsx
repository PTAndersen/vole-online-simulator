export default function Home() {
  return (
    <main>
      <div className="text-center">
        <h1 className="mb-4">Vole online simulator</h1>

        <iframe
          src="/simulator/Vole.html"
          className="w-11/12 sm:w-4/5 md:w-3/4 lg:w-2/3 xl:w-2/3 2xl:w-2/3 mx-auto border-none mb-8"
          style={{ height: '800px' }} // Using inline style for specific pixel height
          title="Vole Online Simulator"
        ></iframe>

        <h1>Vole simulator installations</h1>
        <p>
          Windows installations: <br />
          iOS installations: <br />
          Linux installations: <br />
        </p>
        <h1>About</h1>
        <p>This a simple 4 bit cpu simulator for teaching purposes. <br />
          Created by Peter Tipsmark Andersen as part of his bachelor thesis 2024</p>
      </div>
    </main>
  );
}
