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
        <p className="space-y-4">
          <span className="block">
            Windows 64 bit installations: <br />
            <a href="/downloads/windows/vole-simulator-windows.zip" download className="text-blue-500 hover:text-blue-700 font-semibold underline">
              Download for Windows
            </a>
          </span>
          <span className="block">
            MacOS 64 bit installations: <br />
            <a href="/downloads/ios/vole-simulator-macos.zip" download className="text-blue-500 hover:text-blue-700 font-semibold underline">
              Download for MacOS
            </a>
          </span>
          <span className="block">
            Linux 64 bit installations: <br />
            <a href="/downloads/linux/vole-simulator-linux.zip" download className="text-blue-500 hover:text-blue-700 font-semibold underline">
              Download for Linux
            </a>
          </span>
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
