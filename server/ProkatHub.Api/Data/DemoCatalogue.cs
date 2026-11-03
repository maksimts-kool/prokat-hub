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
}
