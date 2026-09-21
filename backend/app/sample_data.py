"""示例数据：一个中温透明釉的目标氧化物比例与常用原料组成（灼烧基，%）。"""

SAMPLE = {
    "target": {
        "SiO2": 64.624,
        "Al2O3": 10.43,
        "B2O3": 3.875,
        "CaO": 10.775,
        "MgO": 2.736,
        "K2O": 3.30,
        "Na2O": 2.76,
        "ZnO": 1.50,
    },
    "materials": [
        {
            "name": "钾长石",
            "oxides": {"SiO2": 66.0, "Al2O3": 18.5, "K2O": 11.0, "Na2O": 3.0, "CaO": 1.5},
            "min": 0,
            "max": 100,
            "disabled": False,
        },
        {
            "name": "石英",
            "oxides": {"SiO2": 100.0},
            "min": 0,
            "max": 100,
            "disabled": False,
        },
        {
            "name": "高岭土",
            "oxides": {"SiO2": 54.5, "Al2O3": 45.5},
            "min": 0,
            "max": 10,
            "disabled": False,
        },
        {
            "name": "方解石",
            "oxides": {"CaO": 100.0},
            "min": 0,
            "max": 100,
            "disabled": False,
        },
        {
            "name": "滑石",
            "oxides": {"SiO2": 65.8, "MgO": 34.2},
            "min": 0,
            "max": 100,
            "disabled": False,
        },
        {
            "name": "氧化锌",
            "oxides": {"ZnO": 100.0},
            "min": 1,
            "max": 3,
            "disabled": False,
        },
        {
            "name": "硼熔块",
            "oxides": {"SiO2": 40.0, "B2O3": 25.0, "CaO": 15.0, "Na2O": 12.0, "Al2O3": 8.0},
            "min": 0,
            "max": 100,
            "disabled": False,
        },
        {
            "name": "金红石",
            "oxides": {"TiO2": 100.0},
            "min": 0,
            "max": 5,
            "disabled": True,
        },
    ],
}
