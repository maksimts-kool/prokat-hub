using ProkatHub.Api.Domain;

namespace ProkatHub.Api.Data;

/// <summary>Demo data for an electronics rental shop.</summary>
public static class DemoCatalogue
{
    /// <summary>Late fee per day as a share of the daily price.</summary>
    private const decimal LateFeeRate = 1.5m;

    public static IReadOnlyList<DiscountTier> DiscountTiers { get; } =
    [
        new() { Name = "3+ days", MinDays = 3, Percent = 10m },
        new() { Name = "7+ days", MinDays = 7, Percent = 20m },
        new() { Name = "14+ days", MinDays = 14, Percent = 30m },
    ];

    public static IReadOnlyList<Category> Categories(DateTimeOffset now)
    {
        Category cameras = new() { Name = "Cameras", Slug = "cameras", Description = "Mirrorless bodies and action cameras for photo and video." };
        Category lenses = new() { Name = "Lenses", Slug = "lenses", Description = "Zoom and prime lenses for Sony, Canon and Nikon mounts." };
        Category drones = new() { Name = "Drones", Slug = "drones", Description = "Camera drones for aerial photo and FPV video." };
        Category audio = new() { Name = "Audio", Slug = "audio", Description = "Microphones, recorders, headphones and party speakers." };
        Category projectors = new() { Name = "Projectors", Slug = "projectors", Description = "Home cinema and portable projectors." };
        Category laptops = new() { Name = "Laptops", Slug = "laptops", Description = "Laptops for work, editing and gaming." };
        Category consoles = new() { Name = "Gaming consoles", Slug = "gaming-consoles", Description = "Consoles, handhelds and VR headsets." };

        void Add(Category category, string brand, string name, decimal dailyPrice, decimal deposit, string description) =>
            category.Items.Add(new Item
            {
                Brand = brand,
                Name = name,
                Description = description,
                DailyPrice = dailyPrice,
                Deposit = deposit,
                LateFeePerDay = Math.Round(dailyPrice * LateFeeRate, 2),
                ImageUrl = $"https://placehold.co/640x480/png?text={Uri.EscapeDataString(name)}",
                Specifications = SpecificationsFor(name),
                CreatedAt = now,
            });

        Add(cameras, "Sony", "Sony Alpha 7 IV", 45m, 800m, "33 MP full-frame mirrorless camera with 4K 60p video. Includes two batteries and a 128 GB card.");
        Add(cameras, "Canon", "Canon EOS R6 Mark II", 48m, 900m, "24 MP full-frame body with fast autofocus and in-body stabilisation. Great for events and sports.");
        Add(cameras, "Nikon", "Nikon Z6 III", 46m, 850m, "Full-frame hybrid camera with 6K RAW video and a bright electronic viewfinder.");
        Add(cameras, "Fujifilm", "Fujifilm X-T5", 38m, 600m, "40 MP APS-C camera with classic dials and Fujifilm film simulations.");
        Add(cameras, "GoPro", "GoPro HERO13 Black", 15m, 150m, "Waterproof 5.3K action camera with HyperSmooth stabilisation and a chest mount.");

        Add(lenses, "Sony", "Sony FE 24-70mm f/2.8 GM II", 30m, 700m, "Light professional standard zoom for Sony E-mount.");
        Add(lenses, "Canon", "Canon RF 70-200mm f/2.8 L IS USM", 32m, 750m, "Compact telephoto zoom for Canon RF with image stabilisation.");
        Add(lenses, "Sigma", "Sigma 35mm f/1.4 DG DN Art (Sony E)", 18m, 300m, "Sharp wide-aperture prime for street, documentary and low light.");
        Add(lenses, "Sony", "Sony FE 85mm f/1.8", 12m, 200m, "Lightweight portrait prime with smooth background blur.");
        Add(lenses, "Nikon", "Nikon Z 14-30mm f/4 S", 18m, 400m, "Ultra-wide zoom for landscapes, interiors and vlogging on Nikon Z.");

        Add(drones, "DJI", "DJI Mini 4 Pro", 28m, 400m, "Under 249 g drone with 4K HDR video and omnidirectional obstacle sensing. Fly More kit included.");
        Add(drones, "DJI", "DJI Air 3S", 38m, 600m, "Dual-camera drone with a 1-inch main sensor and 45 minutes of flight time.");
        Add(drones, "DJI", "DJI Mavic 3 Pro", 65m, 1200m, "Triple-camera flagship drone with a Hasselblad 4/3 sensor for professional aerial work.");
        Add(drones, "DJI", "DJI Avata 2", 35m, 500m, "FPV drone with goggles and motion controller for immersive flying.");

        Add(audio, "Rode", "Rode Wireless PRO", 14m, 200m, "Two-person wireless microphone kit with 32-bit float on-board recording.");
        Add(audio, "Zoom", "Zoom H6essential Recorder", 12m, 150m, "Six-track 32-bit float field recorder with an X/Y microphone capsule.");
        Add(audio, "Shure", "Shure SM7B", 10m, 200m, "Classic dynamic microphone for podcasts, streaming and vocals.");
        Add(audio, "JBL", "JBL PartyBox 310", 25m, 250m, "Portable party speaker with lights, 18-hour battery and microphone input.");
        Add(audio, "Sony", "Sony WH-1000XM5", 8m, 150m, "Wireless noise-cancelling headphones for travel and focused work.");

        Add(projectors, "Epson", "Epson EH-TW7100", 30m, 400m, "4K-enhanced home cinema projector with 3000 lumens.");
        Add(projectors, "BenQ", "BenQ W2700i", 35m, 500m, "True 4K HDR projector with built-in Android TV for movie nights.");
        Add(projectors, "XGIMI", "XGIMI Halo+", 20m, 300m, "Portable 1080p projector with a battery and Harman Kardon speakers.");
        Add(projectors, "Samsung", "Samsung The Freestyle 2nd Gen", 18m, 250m, "Compact 180-degree projector that fits in a bag.");

        Add(laptops, "Apple", "Apple MacBook Pro 14\" M4 Pro", 40m, 1000m, "14-inch MacBook Pro for video editing and development. 24 GB RAM, 1 TB SSD.");
        Add(laptops, "Apple", "Apple MacBook Air 13\" M3", 25m, 600m, "Thin and silent laptop for study and office work. 16 GB RAM, 512 GB SSD.");
        Add(laptops, "Dell", "Dell XPS 13", 22m, 500m, "Compact Windows ultrabook with a sharp 13.4-inch display.");
        Add(laptops, "Lenovo", "Lenovo ThinkPad X1 Carbon Gen 12", 24m, 600m, "Light business laptop with an excellent keyboard and all-day battery.");
        Add(laptops, "ASUS", "ASUS ROG Zephyrus G14", 35m, 800m, "14-inch gaming laptop with an RTX GPU and a 120 Hz OLED display.");

        Add(consoles, "Sony", "Sony PlayStation 5 Pro", 18m, 400m, "PS5 Pro with two DualSense controllers and a 2 TB SSD.");
        Add(consoles, "Microsoft", "Microsoft Xbox Series X", 14m, 300m, "4K console with Game Pass and two controllers.");
        Add(consoles, "Nintendo", "Nintendo Switch OLED", 10m, 200m, "Hybrid console with a 7-inch OLED screen and two Joy-Cons.");
        Add(consoles, "Meta", "Meta Quest 3", 16m, 300m, "Standalone mixed-reality headset with touch controllers.");
        Add(consoles, "Valve", "Valve Steam Deck OLED", 12m, 300m, "Handheld PC for your Steam library, 512 GB.");

        return [cameras, lenses, drones, audio, projectors, laptops, consoles];
    }

    /// <summary>The demo item's specifications, or none for an item that is not in the demo catalogue.</summary>
    public static List<ItemSpecification> SpecificationsFor(string itemName) =>
        Specifications.TryGetValue(itemName, out var specs)
            ? specs.Select(s => new ItemSpecification { Key = s.Key, Value = s.Value }).ToList()
            : [];

    /// <summary>
    /// Specifications of the demo items by item name. Keys are the camelCase names the client
    /// translates (see <c>item.specs</c> in the client's locale files).
    /// </summary>
    private static readonly Dictionary<string, (string Key, string Value)[]> Specifications = new()
    {
        // Cameras
        ["Sony Alpha 7 IV"] =
        [
            ("sensor", "Full-frame CMOS, 33 MP"), ("video", "4K 60p, 10-bit 4:2:2"), ("stabilisation", "5-axis in-body"),
            ("mount", "Sony E"), ("weight", "658 g"), ("includes", "2 batteries, 128 GB card"),
        ],
        ["Canon EOS R6 Mark II"] =
        [
            ("sensor", "Full-frame CMOS, 24.2 MP"), ("video", "4K 60p, 10-bit"), ("stabilisation", "5-axis in-body, up to 8 stops"),
            ("mount", "Canon RF"), ("weight", "670 g"),
        ],
        ["Nikon Z6 III"] =
        [
            ("sensor", "Full-frame partially stacked CMOS, 24.5 MP"), ("video", "6K 60p N-RAW, 4K 120p"), ("stabilisation", "5-axis in-body"),
            ("mount", "Nikon Z"), ("weight", "760 g"),
        ],
        ["Fujifilm X-T5"] =
        [
            ("sensor", "APS-C X-Trans CMOS 5 HR, 40.2 MP"), ("video", "6.2K 30p, 4K 60p"), ("stabilisation", "5-axis in-body, up to 7 stops"),
            ("mount", "Fujifilm X"), ("weight", "557 g"),
        ],
        ["GoPro HERO13 Black"] =
        [
            ("video", "5.3K 60p, 4K 120p"), ("resolution", "27 MP photos"), ("stabilisation", "HyperSmooth 6.0"),
            ("waterproof", "10 m"), ("weight", "159 g"), ("includes", "Chest mount"),
        ],

        // Lenses
        ["Sony FE 24-70mm f/2.8 GM II"] =
        [
            ("mount", "Sony E"), ("focalLength", "24–70 mm"), ("aperture", "f/2.8"), ("filterSize", "82 mm"), ("weight", "695 g"),
        ],
        ["Canon RF 70-200mm f/2.8 L IS USM"] =
        [
            ("mount", "Canon RF"), ("focalLength", "70–200 mm"), ("aperture", "f/2.8"), ("stabilisation", "Optical, up to 5 stops"),
            ("filterSize", "77 mm"), ("weight", "1070 g"),
        ],
        ["Sigma 35mm f/1.4 DG DN Art (Sony E)"] =
        [
            ("mount", "Sony E"), ("focalLength", "35 mm"), ("aperture", "f/1.4"), ("filterSize", "67 mm"), ("weight", "645 g"),
        ],
        ["Sony FE 85mm f/1.8"] =
        [
            ("mount", "Sony E"), ("focalLength", "85 mm"), ("aperture", "f/1.8"), ("filterSize", "67 mm"), ("weight", "371 g"),
        ],
        ["Nikon Z 14-30mm f/4 S"] =
        [
            ("mount", "Nikon Z"), ("focalLength", "14–30 mm"), ("aperture", "f/4"), ("filterSize", "82 mm"), ("weight", "485 g"),
        ],

        // Drones
        ["DJI Mini 4 Pro"] =
        [
            ("camera", "1/1.3-inch CMOS, 48 MP"), ("video", "4K 60p HDR, 4K 100p"), ("flightTime", "34 min"), ("range", "10 km (CE)"),
            ("weight", "249 g"), ("includes", "3 batteries, charging hub, DJI RC 2"),
        ],
        ["DJI Air 3S"] =
        [
            ("camera", "1-inch CMOS 50 MP + 70 mm tele"), ("video", "4K 60p HDR"), ("flightTime", "45 min"), ("range", "10 km (CE)"),
            ("weight", "724 g"),
        ],
        ["DJI Mavic 3 Pro"] =
        [
            ("camera", "Hasselblad 4/3 CMOS + 70 mm + 166 mm"), ("video", "5.1K 50p, 4K 120p"), ("flightTime", "43 min"),
            ("range", "8 km (CE)"), ("weight", "958 g"),
        ],
        ["DJI Avata 2"] =
        [
            ("camera", "1/1.3-inch CMOS"), ("video", "4K 60p, 155° field of view"), ("flightTime", "23 min"), ("weight", "377 g"),
            ("includes", "DJI Goggles 3, RC Motion 3"),
        ],

        // Audio
        ["Rode Wireless PRO"] =
        [
            ("type", "2 transmitters, 1 receiver"), ("recording", "32-bit float on-board, 32 GB"), ("range", "260 m"),
            ("battery", "Up to 7 h, 30 h with the case"), ("connectivity", "3.5 mm TRS, USB-C"),
        ],
        ["Zoom H6essential Recorder"] =
        [
            ("type", "6-track field recorder"), ("recording", "32-bit float, 96 kHz"), ("connectivity", "4 XLR/TRS inputs, USB-C"),
            ("battery", "4 × AA, up to 8 h"),
        ],
        ["Shure SM7B"] =
        [
            ("type", "Dynamic, cardioid"), ("frequencyRange", "50 Hz – 20 kHz"), ("connectivity", "XLR"), ("weight", "765 g"),
        ],
        ["JBL PartyBox 310"] =
        [
            ("power", "240 W"), ("battery", "Up to 18 h"), ("connectivity", "Bluetooth 5.1, 2 mic/guitar inputs, USB"),
            ("weight", "17.4 kg"),
        ],
        ["Sony WH-1000XM5"] =
        [
            ("type", "Over-ear, noise cancelling"), ("battery", "Up to 30 h"), ("connectivity", "Bluetooth 5.2, 3.5 mm"), ("weight", "250 g"),
        ],

        // Projectors
        ["Epson EH-TW7100"] =
        [
            ("resolution", "4K enhancement, HDR10"), ("brightness", "3000 lm"), ("screenSize", "40–500 in"), ("speakers", "2 × 10 W"),
            ("weight", "6.9 kg"),
        ],
        ["BenQ W2700i"] =
        [
            ("resolution", "4K UHD, HDR10/HLG"), ("brightness", "2000 ANSI lm"), ("screenSize", "30–200 in"), ("os", "Android TV"),
            ("speakers", "2 × 5 W"), ("weight", "4.2 kg"),
        ],
        ["XGIMI Halo+"] =
        [
            ("resolution", "1080p"), ("brightness", "700 ANSI lm"), ("battery", "Up to 2.5 h of video"), ("os", "Android TV"),
            ("speakers", "2 × 5 W Harman Kardon"), ("weight", "1.6 kg"),
        ],
        ["Samsung The Freestyle 2nd Gen"] =
        [
            ("resolution", "1080p"), ("brightness", "550 LED lm"), ("screenSize", "30–100 in"), ("os", "Tizen"),
            ("speakers", "5 W, 360°"), ("weight", "0.8 kg"),
        ],

        // Laptops
        ["Apple MacBook Pro 14\" M4 Pro"] =
        [
            ("cpu", "Apple M4 Pro, 12-core"), ("gpu", "16-core"), ("ram", "24 GB"), ("storage", "1 TB SSD"),
            ("display", "14.2 in Liquid Retina XDR, 3024 × 1964, 120 Hz"), ("battery", "Up to 22 h"), ("os", "macOS"), ("weight", "1.6 kg"),
        ],
        ["Apple MacBook Air 13\" M3"] =
        [
            ("cpu", "Apple M3, 8-core"), ("gpu", "10-core"), ("ram", "16 GB"), ("storage", "512 GB SSD"),
            ("display", "13.6 in Liquid Retina, 2560 × 1664"), ("battery", "Up to 18 h"), ("os", "macOS"), ("weight", "1.24 kg"),
        ],
        ["Dell XPS 13"] =
        [
            ("cpu", "Intel Core Ultra 7 155H"), ("gpu", "Intel Arc"), ("ram", "16 GB LPDDR5x"), ("storage", "512 GB SSD"),
            ("display", "13.4 in, 1920 × 1200, 120 Hz"), ("os", "Windows 11"), ("weight", "1.19 kg"),
        ],
        ["Lenovo ThinkPad X1 Carbon Gen 12"] =
        [
            ("cpu", "Intel Core Ultra 7 155U"), ("gpu", "Intel Graphics"), ("ram", "32 GB"), ("storage", "1 TB SSD"),
            ("display", "14 in, 1920 × 1200"), ("os", "Windows 11 Pro"), ("weight", "1.09 kg"),
        ],
        ["ASUS ROG Zephyrus G14"] =
        [
            ("cpu", "AMD Ryzen 9 8945HS"), ("gpu", "NVIDIA GeForce RTX 4070, 8 GB"), ("ram", "32 GB"), ("storage", "1 TB SSD"),
            ("display", "14 in OLED, 2880 × 1800, 120 Hz"), ("os", "Windows 11"), ("weight", "1.5 kg"),
        ],

        // Gaming consoles
        ["Sony PlayStation 5 Pro"] =
        [
            ("cpu", "AMD Zen 2, 8-core"), ("storage", "2 TB SSD"), ("resolution", "Up to 4K 120 Hz"), ("controllers", "2 × DualSense"),
        ],
        ["Microsoft Xbox Series X"] =
        [
            ("cpu", "AMD Zen 2, 8-core 3.8 GHz"), ("storage", "1 TB SSD"), ("resolution", "Up to 4K 120 Hz"),
            ("controllers", "2 × Xbox Wireless Controller"), ("includes", "Game Pass Ultimate"),
        ],
        ["Nintendo Switch OLED"] =
        [
            ("display", "7 in OLED, 1280 × 720"), ("storage", "64 GB"), ("battery", "4.5–9 h"), ("controllers", "2 × Joy-Con"),
        ],
        ["Meta Quest 3"] =
        [
            ("cpu", "Snapdragon XR2 Gen 2"), ("display", "2064 × 2208 per eye, 120 Hz"), ("storage", "128 GB"),
            ("battery", "Up to 2.2 h"), ("controllers", "2 × Touch Plus"), ("weight", "515 g"),
        ],
        ["Valve Steam Deck OLED"] =
        [
            ("cpu", "AMD APU, Zen 2 4-core"), ("ram", "16 GB LPDDR5"), ("storage", "512 GB SSD"),
            ("display", "7.4 in HDR OLED, 1280 × 800, 90 Hz"), ("battery", "3–12 h"), ("os", "SteamOS"), ("weight", "640 g"),
        ],
    };
}
