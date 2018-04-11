var pyodide = {}

{
    let baseURL = "";
    let wasmURL = baseURL + 'pyodide.asm.wasm?x=' + Date.now();
    let wasmXHR = new XMLHttpRequest();
    wasmXHR.open('GET', wasmURL, true);
    wasmXHR.responseType = 'arraybuffer';
    wasmXHR.onload = function() {
        if (wasmXHR.status === 200 || wasmXHR.status === 0) {
            pyodide.wasmBinary = wasmXHR.response;
        } else {
            alert("Couldn't download the pyodide.asm.wasm binary.  Response was " + wasmXHR.status);
        }

        pyodide.baseURL = baseURL;
        var script = document.createElement('script');
        script.src = baseURL + "pyodide.asm.js";
        document.body.appendChild(script);

        var everythingLoaded = setInterval(function() {
            if (pyodide.runPython !== undefined) {
                clearInterval(everythingLoaded);
                do_benchmark();
            }
        }, 100);
    };
    wasmXHR.send(null);
}

function do_benchmark() {
    console.log("Running benchmark...");
    console.log(pyodide.runPython(
        "setup = 'N=10\\nfrom __main__ import julia'\n" +
        "run = 'julia(1., 1., N, 1.5, 10., 1e4)'\n" +
        "\n" +
        "import numpy as np\n" +
        "_ = np.empty(())\n" +
        "from time import time\n" +
        "\n" +
        "def kernel(zr, zi, cr, ci, lim, cutoff):\n" +
        "    ''' Computes the number of iterations `n` such that\n" +
        "        |z_n| > `lim`, where `z_n = z_{n-1}**2 + c`.\n" +
        "    '''\n" +
        "    count = 0\n" +
        "    while ((zr*zr + zi*zi) < (lim*lim)) and count < cutoff:\n" +
        "        zr, zi = zr * zr - zi * zi + cr, 2 * zr * zi + ci\n" +
        "        count += 1\n" +
        "    return count\n" +
        "\n" +
        "def julia(cr, ci, N, bound=1.5, lim=1000., cutoff=1e6):\n" +
        "    ''' Pure Python calculation of the Julia set for a given `c`.  No NumPy\n" +
        "    array operations are used.\n" +
        "    '''\n" +
        "    julia = np.empty((N, N), np.uint32)\n" +
        "    grid_x = np.linspace(-bound, bound, N)\n" +
        "    for i, x in enumerate(grid_x):\n" +
        "        for j, y in enumerate(grid_x):\n" +
        "            julia[i,j] = kernel(x, y, cr, ci, lim, cutoff)\n" +
        "    return julia\n" +
        "\n" +
        "from timeit import Timer\n" +
        "from js import console\n" +
        "t = Timer(run, setup)\n" +
        "console.profile()\n" +
        "r = t.repeat(11, 40)\n" +
        "print(np.mean(r))\n"
    ));
    console.profileEnd();
}
