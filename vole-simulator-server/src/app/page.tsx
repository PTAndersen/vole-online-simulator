export default function Home() {
  return (
    <main>
      <div className="text-center">
        <h1 className="mb-4">Vole online simulator</h1>

        <iframe
          src="/simulator/Vole.html"
          className="w-11/12 sm:w-4/5 md:w-3/4 lg:w-2/3 xl:w-2/3 2xl:w-2/3 mx-auto border-none mb-8"
          style={{ height: '800px' }}
          title="Vole Online Simulator"
        ></iframe>

        <h1>Vole simulator installations</h1>
        <p>
          Windows installations: <br />
          <a href="/downloads/windows/vole-simulator-windows.zip" download>
            Download for Windows
          </a>
          <br />
          iOS installations: <br />
          <a href="/downloads/ios/vole-simulator-ios.zip" download>
            Download for iOS
          </a>
          <br />
          Linux installations: <br />
          <a href="/downloads/linux/vole-simulator-linux.zip" download>
            Download for Linux
          </a>
        </p>
        <h1>About</h1>
        <p>
          This a simple 8 bit cpu simulator for teaching purposes. <br />
          Created by Peter Tipsmark Andersen as part of his bachelor thesis 2024
        </p>
      </div>
    </main>
  );
}
